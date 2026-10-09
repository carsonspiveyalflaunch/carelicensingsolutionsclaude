import { NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

const DEFAULT_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[-_.]+|[-_.]+$/g, "");
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error("Failed to parse form data:", formError);
      return NextResponse.json(
        { error: "Failed to parse request. Please ensure files are properly formatted." },
        { status: 400 }
      );
    }

    const rawFiles = formData.getAll("files");
    const labels = formData.getAll("labels").map((item) => String(item));
    const bundleSlug = String(formData.get("bundleSlug") || `bundle-${Date.now()}`);
    const bucket = DEFAULT_STORAGE_BUCKET;

    if (rawFiles.length === 0) {
      return NextResponse.json({ files: [] });
    }

    const supabase = createServerSupabaseClient();

    // Ensure bucket exists and is accessible
    let bucketReady = false;
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error("Failed to list storage buckets:", listError);
        // Try to proceed anyway - bucket might exist but listing is restricted
      } else {
        const bucketExists = buckets?.some((b) => b.name === bucket);

        const allowedMimeTypes = [
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        if (!bucketExists) {
          console.log(`Creating storage bucket: ${bucket}`);
          const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
            public: true,
            allowedMimeTypes,
            fileSizeLimit: 10485760, // 10MB
          });

          if (createBucketError) {
            console.error("Failed to create storage bucket:", createBucketError);
            return NextResponse.json(
              {
                error: `Storage bucket '${bucket}' not configured.`,
                details: "Please create a bucket named 'bundle-files' in your Supabase dashboard under Storage, or set SUPABASE_STORAGE_BUCKET environment variable to an existing bucket name."
              },
              { status: 500 },
            );
          }
        } else {
          try {
            const { data: bucketData, error: bucketDataError } = await supabase.storage.getBucket(bucket);
            if (!bucketDataError && bucketData) {
              const publicFlag = bucketData.public ?? true;
              const fileSizeLimit = bucketData.file_size_limit ?? 10485760;
              const { error: updateBucketError } = await supabase.storage.updateBucket(bucket, {
                public: publicFlag,
                allowedMimeTypes,
                fileSizeLimit,
              });
              if (updateBucketError) {
                console.error("Failed to update storage bucket MIME types:", updateBucketError);
              }
            }
          } catch (updateError) {
            console.error("Failed to update existing storage bucket:", updateError);
          }
        }
        bucketReady = true;
      }
    } catch (error) {
      console.error("Error checking/creating bucket:", error);
      // Continue and try upload anyway
    }

    // If we couldn't verify bucket exists, try a test upload to see if it works
    if (!bucketReady) {
      try {
        const testPath = `${bundleSlug}/test-${Date.now()}.txt`;
        const { error: testError } = await supabase.storage
          .from(bucket)
          .upload(testPath, new Uint8Array([116, 101, 115, 116]), {
            contentType: "text/plain",
          });

        if (testError) {
          console.error("Test upload failed:", testError);
          return NextResponse.json(
            {
              error: `Storage bucket '${bucket}' is not accessible.`,
              details: "Please ensure the bucket exists in Supabase Storage and the service role has upload permissions."
            },
            { status: 500 },
          );
        }

        // Clean up test file
        await supabase.storage.from(bucket).remove([testPath]);
        bucketReady = true;
      } catch (error) {
        console.error("Test upload error:", error);
        return NextResponse.json(
          { error: "Storage configuration error. Please check Supabase setup." },
          { status: 500 },
        );
      }
    }

    const uploadedFiles: Array<{
      label: string;
      name: string;
      type: string;
      size: number;
      path: string;
      url?: string;
    }> = [];

    for (let index = 0; index < rawFiles.length; index += 1) {
      const raw = rawFiles[index];
      const file = raw as File;

      if (!file || typeof file.name !== "string" || file.size === 0) {
        console.warn(`Skipping invalid file at index ${index}`);
        continue;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];

      if (!allowedTypes.includes(file.type)) {
        console.warn(`Skipping file with invalid type: ${file.type}`);
        continue;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`Skipping file too large: ${file.size} bytes`);
        continue;
      }

      const label = labels[index] || `file-${index + 1}`;
      const safeLabel = slugify(label);
      const fileExtension = file.name.substring(file.name.lastIndexOf(".")) || "";
      const filePath = `${bundleSlug}/${safeLabel}${fileExtension}`;

      try {
        const fileBuffer = new Uint8Array(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileBuffer, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          console.error(`Upload error for ${file.name}:`, uploadError);
          return NextResponse.json(
            { error: `Failed to upload ${file.name}: ${uploadError.message}` },
            { status: 500 },
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        uploadedFiles.push({
          label,
          name: file.name,
          type: file.type,
          size: file.size,
          path: filePath,
          url: publicUrlData?.publicUrl ?? undefined,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return NextResponse.json(
          { error: `Failed to process ${file.name}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Unexpected error in upload handler:", error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred during file upload. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

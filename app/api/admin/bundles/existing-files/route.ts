import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { requireAdmin } from "@/utils/admin-auth";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";

// Lists what each bundle folder already holds, so the bulk importer can leave
// newer files alone and only fill gaps.
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const supabase = createServerSupabaseClient();
  const storage = supabase.storage.from(BUCKET);

  const folders: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list("", { limit: 1000, offset });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Folders come back without an id.
    folders.push(...(data || []).filter((e) => !e.id && e.name).map((e) => e.name));
    if (!data || data.length < 1000) break;
  }

  const existing: Record<string, string[]> = {};
  const queue = [...folders];
  const worker = async () => {
    while (queue.length > 0) {
      const slug = queue.shift()!;
      const { data } = await storage.list(slug, { limit: 100 });
      const names = (data || []).filter((f) => f.id && f.name).map((f) => f.name);
      if (names.length > 0) existing[slug] = names;
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  return NextResponse.json({ existing });
}

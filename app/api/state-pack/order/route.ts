import { NextRequest, NextResponse } from "next/server";
import { BUNDLE_RESOURCES } from "@/lib/bundle-files";
import { normalizeBundleFileLabel } from "@/lib/bundles";
import { FunnelOrderError } from "@/lib/funnel-checkout";
import { statePackOrderSummary } from "@/lib/state-pack";
import { loadPaidStatePackSession } from "@/lib/state-pack-checkout";
import { getStripe } from "@/lib/stripe-server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";

type SignedFile = { label: string; name: string; url: string };

async function signSlug(supabase: ReturnType<typeof createServerSupabaseClient>, slug: string): Promise<SignedFile[]> {
  const { data: listed, error } = await supabase.storage.from(BUCKET).list(slug, { limit: 100 });
  if (error || !listed) {
    console.error("State pack download list failed:", slug, error);
    return [];
  }
  const chosen = new Map<string, { label: string; name: string; path: string }>();
  for (const file of listed) {
    if (!file?.name || !file.id) continue;
    const label = normalizeBundleFileLabel(file.name);
    if (!(BUNDLE_RESOURCES as readonly string[]).includes(label)) continue;
    const existing = chosen.get(label);
    if (existing && !/\.docx$/i.test(existing.name)) continue;
    chosen.set(label, { label, name: file.name, path: `${slug}/${file.name}` });
  }
  const files: SignedFile[] = [];
  for (const label of BUNDLE_RESOURCES) {
    const file = chosen.get(label);
    if (!file) continue;
    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.path, 60 * 60, { download: file.name });
    if (signError || !data?.signedUrl) {
      console.error("State pack download sign failed:", signError);
      continue;
    }
    files.push({ label: file.label, name: file.name, url: data.signedUrl });
  }
  return files;
}

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const session = await loadPaidStatePackSession(stripe, request.nextUrl.searchParams.get("session_id") || "");
    const summary = statePackOrderSummary(session);
    const supabase = createServerSupabaseClient();
    const programs = [];
    for (const program of summary.programs) {
      programs.push({
        program: program.program,
        assets: program.assets,
        files: await signSlug(supabase, program.slug),
      });
    }
    return NextResponse.json({ ...summary, programs });
  } catch (err) {
    if (err instanceof FunnelOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("State pack order failed:", err);
    return NextResponse.json({ error: "Could not load this order." }, { status: 500 });
  }
}

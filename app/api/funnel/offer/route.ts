import { NextRequest, NextResponse } from "next/server";
import { findCompleteBundle } from "@/lib/complete-bundles";
import { FunnelOrderError, parseStateProgram } from "@/lib/funnel-checkout";
import { listBundleAssets } from "@/lib/bundle-files";
import { BUMP_PURCHASED_ITEM, MRR_PURCHASED_ITEM } from "@/lib/meta-funnel";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Catalog is unavailable." }, { status: 500 });
    }
    const params = request.nextUrl.searchParams;
    const { code, program } = parseStateProgram({
      state: params.get("state"),
      program: params.get("program"),
      type: params.get("type"),
    });
    const supabase = createServerSupabaseClient();
    const bundle = await findCompleteBundle(supabase, code, program);
    if (!bundle) {
      return NextResponse.json({ available: false, checklist: false });
    }
    const assets = await listBundleAssets(supabase, bundle.product_slug);
    return NextResponse.json({
      available: assets.some((asset) => asset.label === MRR_PURCHASED_ITEM),
      checklist: assets.some((asset) => asset.label === BUMP_PURCHASED_ITEM),
      stateName: bundle.state,
      program: bundle.program,
      code: bundle.code,
    });
  } catch (err) {
    if (err instanceof FunnelOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Funnel offer lookup failed:", err);
    return NextResponse.json({ error: "Could not check this report." }, { status: 500 });
  }
}

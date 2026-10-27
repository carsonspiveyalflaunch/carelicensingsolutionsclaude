import { NextRequest, NextResponse } from "next/server";
import { bundleOfferFlags, listSellableBundleAssets } from "@/lib/bundle-files";
import { catalogClients, findCompleteBundle } from "@/lib/complete-bundles";
import { FunnelOrderError, parseStateProgram } from "@/lib/funnel-checkout";

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") return err.message;
  return "lookup failed";
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const { code, program } = parseStateProgram({
      state: params.get("state"),
      program: params.get("program"),
      type: params.get("type"),
    });
    const clients = catalogClients();
    if (!clients.length) {
      return NextResponse.json({ error: "Catalog is unavailable." }, { status: 500 });
    }

    let lastError: unknown;
    for (const supabase of clients) {
      try {
        const bundle = await findCompleteBundle(supabase, code, program);
        if (!bundle) {
          return NextResponse.json({ available: false, checklist: false });
        }
        const assets = await listSellableBundleAssets(supabase, bundle.product_slug);
        return NextResponse.json({
          ...bundleOfferFlags(assets),
          stateName: bundle.state,
          program: bundle.program,
          code: bundle.code,
        });
      } catch (err) {
        lastError = err;
        console.error("Funnel offer reader failed:", errorText(err));
      }
    }

    console.error("Funnel offer lookup failed:", errorText(lastError));
    return NextResponse.json({ error: "Could not check this report." }, { status: 500 });
  } catch (err) {
    if (err instanceof FunnelOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Funnel offer lookup failed:", errorText(err));
    return NextResponse.json({ error: "Could not check this report." }, { status: 500 });
  }
}

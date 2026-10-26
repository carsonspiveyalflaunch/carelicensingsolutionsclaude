import { NextRequest, NextResponse } from "next/server";
import { BUNDLE_RESOURCES } from "@/lib/bundle-files";
import { normalizeBundleFileLabel } from "@/lib/bundles";
import { FunnelOrderError, loadPaidFunnelSession } from "@/lib/funnel-checkout";
import { isUpsellComplete } from "@/lib/funnel-fulfill";
import { BUMP_PURCHASED_ITEM, MRR_PURCHASED_ITEM } from "@/lib/meta-funnel";
import { readItemsMetadata } from "@/lib/stripe-items";
import { getStripe } from "@/lib/stripe-server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const params = request.nextUrl.searchParams;
    const session = await loadPaidFunnelSession(stripe, params.get("session_id") || "");
    const supabase = createServerSupabaseClient();
    const upsellTaken = await isUpsellComplete(stripe, supabase, session, {
      upsellSession: params.get("upsell_session"),
      upsellPi: params.get("upsell_pi"),
    });

    const items = readItemsMetadata(session.metadata);
    const slug = String(items.find((item) => item?.product_slug)?.product_slug || "");
    if (!slug) return NextResponse.json({ files: [], fullKit: upsellTaken });

    const labels = new Set<string>(
      upsellTaken
        ? [...BUNDLE_RESOURCES]
        : items.map((item) => String(item.purchased_item || "")).filter(Boolean),
    );
    if (!upsellTaken && labels.size === 0) labels.add(MRR_PURCHASED_ITEM);

    const { data: listed, error } = await supabase.storage.from(BUCKET).list(slug, { limit: 100 });
    if (error || !listed) {
      console.error("Funnel download list failed:", error);
      return NextResponse.json({ files: [], fullKit: upsellTaken });
    }

    const files = [];
    for (const file of listed) {
      if (!file?.name || !file.id) continue;
      const label = normalizeBundleFileLabel(file.name);
      if (!(BUNDLE_RESOURCES as readonly string[]).includes(label)) continue;
      if (!labels.has(label)) continue;
      const path = `${slug}/${file.name}`;
      const { data, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60, { download: file.name });
      if (signError || !data?.signedUrl) {
        console.error("Funnel download sign failed:", signError);
        continue;
      }
      files.push({
        label: label === BUMP_PURCHASED_ITEM ? "Licensing Checklist" : label,
        name: file.name,
        url: data.signedUrl,
      });
    }

    return NextResponse.json({ files, fullKit: upsellTaken });
  } catch (err) {
    if (err instanceof FunnelOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Funnel downloads failed:", err);
    return NextResponse.json({ error: "Could not prepare your download." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { FunnelOrderError, funnelOrderSummary, loadPaidFunnelSession } from "@/lib/funnel-checkout";
import { findCompletedUpsell, isUpsellComplete, upsellPurchaseEventId } from "@/lib/funnel-fulfill";
import { getStripe } from "@/lib/stripe-server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

function missingCheckoutStatus(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const code = "code" in err ? String((err as { code?: unknown }).code || "") : "";
  const statusCode = "statusCode" in err ? Number((err as { statusCode?: unknown }).statusCode) : 0;
  if (code === "resource_missing" || statusCode === 404) return 404;
  return null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sessionId = (params.get("session_id") || "").trim();
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.json({ error: "Unknown checkout." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const session = await loadPaidFunnelSession(stripe, sessionId);
    const supabase = createServerSupabaseClient();
    const upsellTaken = await isUpsellComplete(stripe, supabase, session, {
      upsellSession: params.get("upsell_session"),
      upsellPi: params.get("upsell_pi"),
    });
    const upsellRow = upsellTaken ? await findCompletedUpsell(supabase, session.id) : null;
    const summary = funnelOrderSummary(session, upsellTaken);
    const kitEventId =
      upsellPurchaseEventId(upsellRow) ||
      (params.get("upsell_pi") || "").trim() ||
      (params.get("upsell_session") || "").trim();
    return NextResponse.json(upsellTaken && kitEventId ? { ...summary, kitEventId } : summary);
  } catch (err) {
    if (err instanceof FunnelOrderError || (err instanceof Error && err.name === "FunnelOrderError")) {
      const status = err instanceof FunnelOrderError ? err.status : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    const missing = missingCheckoutStatus(err);
    if (missing) return NextResponse.json({ error: "Unknown checkout." }, { status: missing });
    console.error("Funnel order lookup failed:", err);
    return NextResponse.json({ error: "Could not load this order." }, { status: 500 });
  }
}

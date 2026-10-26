import { NextRequest, NextResponse } from "next/server";
import { FunnelOrderError, funnelOrderSummary, loadPaidFunnelSession } from "@/lib/funnel-checkout";
import { isUpsellComplete } from "@/lib/funnel-fulfill";
import { getStripe } from "@/lib/stripe-server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const params = request.nextUrl.searchParams;
    const sessionId = params.get("session_id") || "";
    const session = await loadPaidFunnelSession(stripe, sessionId);
    const supabase = createServerSupabaseClient();
    const upsellTaken = await isUpsellComplete(stripe, supabase, session, {
      upsellSession: params.get("upsell_session"),
      upsellPi: params.get("upsell_pi"),
    });
    return NextResponse.json(funnelOrderSummary(session, upsellTaken));
  } catch (err) {
    if (err instanceof FunnelOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Funnel order lookup failed:", err);
    return NextResponse.json({ error: "Could not load this order." }, { status: 500 });
  }
}

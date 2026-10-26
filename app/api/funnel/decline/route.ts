import { NextRequest, NextResponse } from "next/server";
import { FunnelOrderError, loadPaidFunnelSession } from "@/lib/funnel-checkout";
import { queueFunnelEmail } from "@/lib/funnel-email";
import { creditExpiresIso } from "@/lib/meta-funnel";
import { getStripe } from "@/lib/stripe-server";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const session = await loadPaidFunnelSession(stripe, sessionId);
    const queued = await queueFunnelEmail("meta_mrr_launch_kit_declined", {
      email: session.customer_details?.email || session.customer_email,
      name: session.customer_details?.name,
      sessionId: session.id,
      state: session.metadata?.state,
      program: session.metadata?.program,
      creditExpiresAt: creditExpiresIso(session.created || Math.floor(Date.now() / 1000)),
      amount: session.amount_total != null ? session.amount_total / 100 : null,
    });
    return NextResponse.json(queued);
  } catch (err) {
    if (err instanceof FunnelOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Funnel decline hook failed:", err);
    return NextResponse.json({ error: "Could not save that choice." }, { status: 500 });
  }
}

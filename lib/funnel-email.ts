/**
 * Email hooks for the Meta report funnel. The purchase receipt and download
 * login still go out through the existing Stripe webhook (Resend).
 * These sequence hooks are stubs until an ESP flow is connected.
 *
 * Hooks:
 * - meta_mrr_purchased — front-end report (and optional checklist) paid
 * - meta_mrr_launch_kit_declined — buyer skipped the $950 kit; credit still open
 * - meta_mrr_launch_kit_accepted — buyer paid the kit upsell
 */
export type FunnelEmailHook =
  | "meta_mrr_purchased"
  | "meta_mrr_launch_kit_declined"
  | "meta_mrr_launch_kit_accepted";

export type FunnelEmailPayload = {
  email?: string | null;
  name?: string | null;
  sessionId?: string | null;
  state?: string | null;
  program?: string | null;
  creditExpiresAt?: string | null;
  amount?: number | null;
};

export async function queueFunnelEmail(
  hook: FunnelEmailHook,
  payload: FunnelEmailPayload,
): Promise<{ queued: false; reason: "esp-not-wired" }> {
  console.log(
    JSON.stringify({
      event: "funnel-email-stub",
      hook,
      email: payload.email || null,
      sessionId: payload.sessionId || null,
      state: payload.state || null,
      program: payload.program || null,
      creditExpiresAt: payload.creditExpiresAt || null,
      amount: payload.amount ?? null,
    }),
  );
  return { queued: false, reason: "esp-not-wired" };
}

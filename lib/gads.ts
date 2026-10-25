// Google Ads conversion events. The Google tag (AW-18531893917) is loaded in
// app/layout.tsx; these send conversions to the matching conversion actions.
// Labels come from Google Ads → Goals → Conversions → (action) → Tag setup.
const AW_ID = "AW-18531893917";
const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL || "";
const BEGIN_CHECKOUT_LABEL = process.env.NEXT_PUBLIC_GADS_BEGIN_CHECKOUT_LABEL || "";
const LEAD_LABEL = process.env.NEXT_PUBLIC_GADS_LEAD_LABEL || "";

type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === "function" ? g : null;
}

/**
 * A confirmed, paid order. Only call after /api/verify-purchase succeeds.
 * transaction_id lets Google drop repeats (refreshes, re-verification).
 */
export function trackPurchase(orderId: string, value: number) {
  const g = gtag();
  if (!g || !PURCHASE_LABEL || !orderId || !(value > 0)) return;
  const key = `gads-purchase-${orderId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage blocked: Google still dedupes on transaction_id.
  }
  g("event", "conversion", {
    send_to: `${AW_ID}/${PURCHASE_LABEL}`,
    value,
    currency: "USD",
    transaction_id: orderId,
  });
}

/**
 * A Checkout Session exists and the browser is about to leave for Stripe.
 *
 * The Begin checkout action in Google Ads uses one fixed value (0) for every
 * conversion, so the reported conversion value stays 0 either way. Callers
 * still pass the cart total in USD when they have it: that is the amount the
 * buyer is about to pay, and it stays correct if the action is later switched
 * to "Use different values for each conversion." Omit `value` to send currency
 * only. `0` is sent when the caller passes it (a free checkout still started).
 *
 * `transport_type: "beacon"` so the hit survives the immediate redirect.
 * No-op when the label env is empty or gtag has not loaded.
 */
export function trackBeginCheckout(value?: number) {
  const g = gtag();
  if (!g || !BEGIN_CHECKOUT_LABEL) return;
  g("event", "conversion", {
    send_to: `${AW_ID}/${BEGIN_CHECKOUT_LABEL}`,
    currency: "USD",
    ...(typeof value === "number" && Number.isFinite(value) ? { value } : {}),
    transport_type: "beacon",
  });
}

/** A visitor handed over their email/phone through one of the site's lead forms. */
export function trackLead(source: string) {
  const g = gtag();
  if (!g || !LEAD_LABEL) return;
  // beacon so the hit survives an immediate redirect (agency finder → /get-started).
  g("event", "conversion", { send_to: `${AW_ID}/${LEAD_LABEL}`, lead_source: source, transport_type: "beacon" });
}

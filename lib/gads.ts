// Google Ads conversion events. The Google tag (AW-18531893917) is loaded in
// app/layout.tsx; these send conversions to the matching conversion actions.
// Labels come from Google Ads → Goals → Conversions → (action) → Tag setup.
const AW_ID = "AW-18531893917";
const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL || "";
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

/** A visitor handed over their email/phone through one of the site's lead forms. */
export function trackLead(source: string) {
  const g = gtag();
  if (!g || !LEAD_LABEL) return;
  // beacon so the hit survives an immediate redirect (agency finder → /get-started).
  g("event", "conversion", { send_to: `${AW_ID}/${LEAD_LABEL}`, lead_source: source, transport_type: "beacon" });
}

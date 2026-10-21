/**
 * Buy-now-pay-later at checkout (Afterpay: 4 interest-free payments). Turn on
 * only while Afterpay is enabled in the Stripe dashboard (Settings → Payment methods).
 * Klarna and Affirm are marked "Ineligible" for this account, so they are not requested;
 * Stripe rejects checkout sessions that request a method that isn't active.
 * Vercel env: NEXT_PUBLIC_PAY_LATER=1
 */
export const PAY_LATER_ENABLED = process.env.NEXT_PUBLIC_PAY_LATER === "1";

// All of these settle immediately (no delayed "processing" payments), so the
// webhook can grant file access on checkout.session.completed as it does today.
export const CHECKOUT_PAYMENT_METHODS: ("card" | "afterpay_clearpay")[] = PAY_LATER_ENABLED
  ? ["card", "afterpay_clearpay"]
  : ["card"];

/** Each of 4 interest-free payments, rounded to cents. */
export function payIn4(total: number): string {
  const each = Math.ceil((total / 4) * 100) / 100;
  return `$${each.toFixed(2)}`;
}

/** Optional short walkthrough video shown on every /go page. Any YouTube, Loom or Vimeo link works. */
export function walkthroughEmbedUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_WALKTHROUGH_VIDEO_URL || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith("loom.com")) return `https://www.loom.com/embed/${u.pathname.split("/").filter(Boolean).pop()}`;
    if (host.endsWith("vimeo.com")) return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean).pop()}`;
    return null;
  } catch {
    return null;
  }
}

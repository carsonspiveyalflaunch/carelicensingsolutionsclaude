/**
 * Discount codes the site accepts, in one place. The checkout API, the cart
 * and the /go sales pages all read from here, so an expired code stops
 * working everywhere at the same moment.
 */
type Promo = { percent: number; expiresAt?: string };

// LAUNCH20 ends Saturday, Oct 31, 2026 at 11:59 PM Pacific (07:59 UTC Nov 1).
export const LAUNCH_DEADLINE_ISO = "2026-11-01T06:59:59Z";
export const LAUNCH_DEADLINE_LABEL = "Saturday, Oct 31";

export const PROMO_CODES: Record<string, Promo> = {
  LAUNCH20: { percent: 20, expiresAt: LAUNCH_DEADLINE_ISO },
  SAVE15: { percent: 15 },
  SAVE10: { percent: 10 },
  WELCOME5: { percent: 5 },
};

/** Percent off for a code right now, or 0 if unknown or expired. */
export function promoPercent(code: string | undefined | null, now: number = Date.now()): number {
  if (!code) return 0;
  const promo = PROMO_CODES[code.trim().toUpperCase()];
  if (!promo) return 0;
  if (promo.expiresAt && now > new Date(promo.expiresAt).getTime()) return 0;
  return promo.percent;
}

/** Deadline label to show next to a code, if it has one and is still live. */
export function promoDeadline(code: string | undefined | null, now: number = Date.now()): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  const promo = PROMO_CODES[upper];
  if (!promo?.expiresAt || promoPercent(upper, now) === 0) return null;
  return upper === "LAUNCH20" ? LAUNCH_DEADLINE_LABEL : new Date(promo.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

import type Stripe from "stripe";

/**
 * Server-applied Checkout promotion codes for internal screenshots.
 * Customer-typed codes on the hosted page stay available when no code is passed.
 * Anything outside this list is rejected before Stripe is called.
 */
export const FUNNEL_SERVER_PROMOS = new Set(["CLSFREE1", "CLSTEST50"]);

export class FunnelPromoError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "FunnelPromoError";
  }
}

/** Allowlisted code from the order body, or null when the buyer didn't send one. */
export function readFunnelPromo(input: {
  promotionCode?: unknown;
  promoCode?: unknown;
  promo?: unknown;
}): string | null {
  const raw = input.promotionCode ?? input.promoCode ?? input.promo;
  if (raw == null) return null;
  const code = String(raw).trim().toUpperCase();
  if (!code) return null;
  if (!FUNNEL_SERVER_PROMOS.has(code)) {
    throw new FunnelPromoError("That promotion code can't be used on this checkout.");
  }
  return code;
}

/** Dollar total after a coupon, plus the percent we store on the session. */
export function approximateFunnelDiscount(
  subtotalDollars: number,
  coupon: { percent_off?: number | null; amount_off?: number | null },
): { percent: number; total: number } {
  const subtotalCents = Math.round(subtotalDollars * 100);
  if (coupon.percent_off) {
    const off = Math.round(subtotalCents * (coupon.percent_off / 100));
    const totalCents = Math.max(0, subtotalCents - off);
    return { percent: coupon.percent_off, total: totalCents / 100 };
  }
  if (coupon.amount_off) {
    const off = Math.min(coupon.amount_off, subtotalCents);
    const totalCents = Math.max(0, subtotalCents - off);
    const percent = subtotalCents > 0 ? Math.round((off / subtotalCents) * 100) : 0;
    return { percent, total: totalCents / 100 };
  }
  return { percent: 0, total: subtotalDollars };
}

export function dollarsMetadata(amount: number): string {
  const cents = Math.round(amount * 100);
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/**
 * Stripe rejects a session that sets both `discounts` and `allow_promotion_codes`.
 * A server-applied code uses discounts only. `if_required` lets a 100% code finish
 * with payment_status no_payment_required instead of demanding a card.
 */
export function funnelDiscountSessionFields(applied: { id: string } | null): Pick<
  Stripe.Checkout.SessionCreateParams,
  "allow_promotion_codes" | "discounts" | "payment_method_collection"
> {
  if (!applied) return { allow_promotion_codes: true };
  return {
    discounts: [{ promotion_code: applied.id }],
    payment_method_collection: "if_required",
  };
}

type PromoCouponRef = string | { id?: string; percent_off?: number | null; amount_off?: number | null };

export function couponRefFromPromo(promo: Stripe.PromotionCode): PromoCouponRef | null {
  const record = promo as Stripe.PromotionCode & {
    coupon?: PromoCouponRef;
    promotion?: { coupon?: PromoCouponRef };
  };
  return record.promotion?.coupon ?? record.coupon ?? null;
}

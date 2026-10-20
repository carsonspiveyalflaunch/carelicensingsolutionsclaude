import type Stripe from 'stripe';

/**
 * What the customer actually paid, read from Stripe itself rather than the
 * pre-discount totals we stash in metadata. Promotion codes typed on Stripe's
 * page (e.g. TEST100) only show up here.
 */
export async function orderTotals(stripe: Stripe | null, session: Stripe.Checkout.Session) {
  const cents = (v: number | null | undefined) => (typeof v === 'number' ? v / 100 : null);
  const metaTotal = parseFloat(session.metadata?.total || '0');

  const total = cents(session.amount_total) ?? metaTotal;
  const subtotal = cents(session.amount_subtotal) ?? parseFloat(session.metadata?.subtotal || '0');
  const discountAmount = cents(session.total_details?.amount_discount) ?? 0;

  let discountCode = session.metadata?.discount_code || '';
  if (!discountCode && stripe) {
    const promo = (session as any).discounts?.find((d: any) => d?.promotion_code)?.promotion_code;
    if (typeof promo === 'string') {
      try {
        discountCode = (await stripe.promotionCodes.retrieve(promo)).code || '';
      } catch {
        discountCode = '';
      }
    } else if (promo?.code) {
      discountCode = promo.code;
    }
  }

  return { total, subtotal, discountAmount, discountCode };
}

/** Buyer's real name: Stripe's, then the checkout form's, then the email. */
export function buyerName(session: Stripe.Checkout.Session, customerInfo: any = {}, email = ''): string {
  return (
    session.customer_details?.name?.trim() ||
    `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim() ||
    session.metadata?.customer_first_name?.trim() ||
    email ||
    'Customer'
  );
}

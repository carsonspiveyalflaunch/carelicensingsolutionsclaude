/**
 * Server-side source of truth for what a cart item costs and what it is called.
 *
 * The browser sends a price and a name with every cart item, but either value
 * can be wrong. resolveCartItems() looks each item up and returns the price to
 * charge and the name to show on Stripe. Prices are unchanged by the name fix.
 */

import { checkoutDisplayName } from "./checkout-name";
import { resolveProductForItem } from "./resolve-product";

export const COURSE_SLUG = 'course-operational-success-academy';
export const COURSE_PRICE = 697;

/** Generic "Complete State Licensing Bundle" sold from the bundles page. */
export const STANDARD_BUNDLE_PRICE = 997;

/** Single resources sold out of a bundle (the "get started" flow). */
export const INDIVIDUAL_ITEM_PRICES: Record<string, number> = {
  'Market Research Report': 397,
  'Policy & Procedure Manual': 497,
  'Pro Forma P&L Template': 297,
  'Licensing Checklist': 397,
};
export const DEFAULT_INDIVIDUAL_ITEM_PRICE = 397;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QUANTITY = 10;

export class PricingError extends Error {}

function toQuantity(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_QUANTITY);
}

async function findProduct(supabase: any, column: 'id' | 'product_slug', value: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id, price, is_active')
    .eq(column, value)
    .maybeSingle();
  if (error) throw new PricingError('Unable to look up product pricing');
  if (!data || data.is_active === false) return null;
  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  return { id: data.id as string, price };
}

async function resolveUnitPrice(supabase: any, item: any): Promise<number> {
  const id = typeof item?.id === 'string' ? item.id : '';
  const slug = typeof item?.product_slug === 'string' ? item.product_slug : '';
  const productId = typeof item?.product_id === 'string' ? item.product_id : '';

  // One resource bought out of a bundle: fixed price list.
  if (typeof item?.purchased_item === 'string' && item.purchased_item) {
    return INDIVIDUAL_ITEM_PRICES[item.purchased_item] ?? DEFAULT_INDIVIDUAL_ITEM_PRICE;
  }

  // "Sample only" from the compare pop-up: id is "<product uuid>-sample".
  if (id.endsWith('-sample')) {
    const base = id.slice(0, -'-sample'.length);
    const product = UUID.test(base) ? await findProduct(supabase, 'id', base) : null;
    return product?.price ?? DEFAULT_INDIVIDUAL_ITEM_PRICE;
  }

  // A product in the database, by id or by slug.
  for (const candidate of [productId, id]) {
    if (UUID.test(candidate)) {
      const product = await findProduct(supabase, 'id', candidate);
      if (product) return product.price;
    }
  }
  for (const candidate of [slug, id]) {
    if (candidate && !UUID.test(candidate)) {
      const product = await findProduct(supabase, 'product_slug', candidate);
      if (product) return product.price;
    }
  }

  if (slug === COURSE_SLUG || id === COURSE_SLUG) return COURSE_PRICE;

  // Generic bundle from the bundles page ("bundle-<state>-<type>").
  if (id.startsWith('bundle-')) return STANDARD_BUNDLE_PRICE;

  throw new PricingError(`"${checkoutDisplayName(item, null)}" is not available for purchase`);
}

/**
 * Returns the cart with every price, quantity, and display name replaced by
 * trusted values. Throws PricingError when an item cannot be priced.
 */
export async function resolveCartItems(supabase: any, items: any[]): Promise<any[]> {
  const resolved = [];
  for (const item of items) {
    const price = await resolveUnitPrice(supabase, item);
    let product: any = null;
    try {
      product = await resolveProductForItem(supabase, item);
    } catch {
      product = null;
    }
    resolved.push({
      ...item,
      name: checkoutDisplayName(item, product),
      price,
      quantity: toQuantity(item?.quantity),
      purchased_item_price: item?.purchased_item ? price : item?.purchased_item_price ?? null,
    });
  }
  return resolved;
}

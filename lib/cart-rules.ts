/**
 * Cart rule: a single resource (e.g. "Licensing Checklist") can't be bought
 * alongside the bundle for the same state + program type, because the bundle
 * already includes it. A different state and/or program type is fine.
 *
 * Shared by the browser cart and the checkout API so it can't be bypassed.
 */

type AnyItem = Record<string, any>;

const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

export const isSingleAsset = (item: AnyItem) => typeof item?.purchased_item === 'string' && item.purchased_item !== '';

const isCourse = (item: AnyItem) =>
  norm(item?.product_slug).startsWith('course-') || norm(item?.id).startsWith('course-') || norm(item?.type) === 'course';

export const isBundle = (item: AnyItem) => !isSingleAsset(item) && !isCourse(item) && !norm(item?.id).endsWith('-sample');

/** Identifiers of the bundle an item is, or (for a single asset) the bundle it came from. */
function bundleKeys(item: AnyItem): Set<string> {
  const keys = new Set<string>();
  const fields = isSingleAsset(item) ? [item.bundle_id, item.product_id, item.product_slug] : [item.id, item.product_id, item.product_slug];
  for (const f of fields) if (norm(f)) keys.add(norm(f));
  if (norm(item?.state) && norm(item?.type)) keys.add(`st:${norm(item.state)}|${norm(item.type)}`);
  return keys;
}

/** True when a single asset belongs to the given bundle (same state + program type). */
export function assetBelongsToBundle(asset: AnyItem, bundle: AnyItem): boolean {
  if (!isSingleAsset(asset) || !isBundle(bundle)) return false;
  const b = bundleKeys(bundle);
  for (const k of bundleKeys(asset)) if (b.has(k)) return true;
  return false;
}

/** Single assets in the cart that are already covered by a bundle in the cart. */
export function findCoveredAssets(items: AnyItem[]): AnyItem[] {
  const bundles = items.filter(isBundle);
  return items.filter((i) => isSingleAsset(i) && bundles.some((b) => assetBelongsToBundle(i, b)));
}

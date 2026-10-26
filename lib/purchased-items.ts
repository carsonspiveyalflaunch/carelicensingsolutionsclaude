/**
 * null or [] means the whole bundle is unlocked. A later single-file grant
 * must not take that away (the report webhook can land after the kit upsell).
 * `existing === undefined` means there is no row yet.
 */
export function mergePurchasedItems(
  existing: string[] | null | undefined,
  incoming: string[] | null,
): string[] | null {
  if (existing === undefined) return incoming && incoming.length > 0 ? [...new Set(incoming)] : null;
  if (existing === null || existing.length === 0 || incoming === null || incoming.length === 0) return null;
  return [...new Set([...existing, ...incoming])];
}

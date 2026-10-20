// Stripe caps each metadata value at 500 characters (and 50 keys total).
// A cart's item list easily passes 500 once it has 2+ items, so we store the
// JSON compactly and split it across items, items_2, items_3, ... keys.

const CHUNK = 490;
const MAX_CHUNKS = 30;

export function packItemsMetadata(items: Record<string, unknown>[]): Record<string, string> {
  // Drop null/empty fields to keep the payload small.
  const compact = items.map((item) =>
    Object.fromEntries(Object.entries(item).filter(([, v]) => v !== null && v !== undefined && v !== ''))
  );
  const json = JSON.stringify(compact);
  const out: Record<string, string> = {};
  for (let i = 0, n = 0; i < json.length; i += CHUNK, n++) {
    if (n >= MAX_CHUNKS) throw new Error('Cart is too large to check out in one order');
    out[n === 0 ? 'items' : `items_${n + 1}`] = json.slice(i, i + CHUNK);
  }
  if (!out.items) out.items = '[]';
  return out;
}

export function readItemsMetadata(metadata: Record<string, string> | null | undefined): any[] {
  if (!metadata?.items) return [];
  let json = metadata.items;
  for (let n = 2; metadata[`items_${n}`] !== undefined; n++) json += metadata[`items_${n}`];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

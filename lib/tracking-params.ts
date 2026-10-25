// Ad click ids and UTM params the landing page and direct-checkout buttons keep
// on the URL when a buyer is sent to Stripe and comes back.

export const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "fbclid",
  "msclkid",
] as const;

/** Catalog display names we will put on a Stripe line item. "x" is the bad client placeholder. */
export function isTrustedCatalogName(name: unknown): name is string {
  if (typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length > 1 && trimmed.toLowerCase() !== "x";
}

function trackingQuery(currentSearch: string): URLSearchParams {
  const incoming = new URLSearchParams(currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch);
  const out = new URLSearchParams();
  for (const key of TRACKING_KEYS) {
    const value = incoming.get(key);
    if (value) out.set(key, value);
  }
  return out;
}

/** Cancel URL on our domain, with any ad params from the current page added. */
export function cancelUrlWithTracking(origin: string, cancelPath: string, currentSearch: string): string {
  const url = new URL(cancelPath, origin);
  trackingQuery(currentSearch).forEach((value, key) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  });
  return url.toString();
}

/**
 * Success URL including Stripe's {CHECKOUT_SESSION_ID} placeholder.
 * Returns undefined when the visit has no tracking params, so the API default is used.
 * The placeholder is concatenated, not passed through URLSearchParams, which would encode the braces.
 */
export function successUrlWithTracking(origin: string, currentSearch: string): string | undefined {
  const qs = trackingQuery(currentSearch).toString();
  if (!qs) return undefined;
  return `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&${qs}`;
}

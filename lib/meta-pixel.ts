/**
 * Meta Pixel helpers. The pixel loads only when NEXT_PUBLIC_META_PIXEL_ID is a
 * numeric id. Carson pastes the real id in Vercel and redeploys — never hardcode one.
 */
export const META_PIXEL_ENV = "NEXT_PUBLIC_META_PIXEL_ID";

export function metaPixelId(): string {
  const id = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
  return /^\d{5,20}$/.test(id) ? id : "";
}

type Fbq = (...args: unknown[]) => void;

function fbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  if (!metaPixelId()) return null;
  const fn = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fn === "function" ? fn : null;
}

/** The base pixel is beforeInteractive, but the first events can still race it. */
function whenFbq(run: (pixel: Fbq) => void) {
  const ready = fbq();
  if (ready) {
    run(ready);
    return;
  }
  if (!metaPixelId() || typeof window === "undefined") return;
  const started = Date.now();
  const timer = window.setInterval(() => {
    const pixel = fbq();
    if (pixel || Date.now() - started > 4000) {
      window.clearInterval(timer);
      if (pixel) run(pixel);
    }
  }, 100);
}

function once(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

export function trackMetaPageView() {
  whenFbq((pixel) => pixel("track", "PageView"));
}

export function trackMetaViewContent() {
  whenFbq((pixel) =>
    pixel("track", "ViewContent", {
      content_ids: ["mrr_47"],
      content_name: "State Market Research Report",
      content_type: "product",
      value: 47,
      currency: "USD",
    }),
  );
}

export function trackMetaInitiateCheckout(value: number, contentIds: string[]) {
  whenFbq((pixel) =>
    pixel("track", "InitiateCheckout", {
      value,
      currency: "USD",
      content_ids: contentIds,
      content_type: "product",
      num_items: contentIds.length,
    }),
  );
}

/** Deduped per order + content id so the upsell page and thank-you page don't double-count. */
export function trackMetaPurchase(orderId: string, value: number, contentIds: string[]) {
  if (!metaPixelId() || !orderId || !(value > 0) || contentIds.length === 0) return;
  const key = `meta-purchase-${orderId}-${contentIds.join("-")}`;
  if (!once(key)) return;
  whenFbq((pixel) =>
    pixel("track", "Purchase", {
      value,
      currency: "USD",
      content_ids: contentIds,
      content_type: "product",
    }),
  );
}

/**
 * Meta ads low-ticket funnel. Prices here are the funnel SKU only.
 * The shop and /launch-kit keep charging catalog prices (report $397, kit $997)
 * through resolveCartItems. Do not reuse these numbers on those pages.
 */
import { checkoutDisplayName, type CheckoutProduct } from "./checkout-name";

export const META_FUNNEL = "meta_mrr" as const;

export const MRR_PRICE_DOLLARS = 47;
export const LAUNCH_KIT_PRICE_DOLLARS = 997;
export const MRR_CREDIT_DOLLARS = 47;
/** Funnel-only charge while the report credit is open. /launch-kit stays $997. */
export const UPSELL_PRICE_DOLLARS = 647;
/** $997 − $647. The $47 report credit is part of this offer, shown only after payment. */
export const UPSELL_SAVINGS_DOLLARS = LAUNCH_KIT_PRICE_DOLLARS - UPSELL_PRICE_DOLLARS;
export const CREDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Meta content_ids. Front-end purchase uses mrr_47; the kit upsell uses launch_kit_997. */
export const CONTENT_MRR = "mrr_47";
export const CONTENT_LAUNCH_KIT = "launch_kit_997";

/** File labels the dashboard and storage already use. Do not rename. */
export const MRR_PURCHASED_ITEM = "Market Research Report";
/** Bundle file delivered with the Launch Kit, not a checkout add-on. */
export const BUMP_PURCHASED_ITEM = "Licensing Checklist";

/** Proprietary name for the tripwire method. The file itself is the Market Research Report. */
export const METHOD_NAME = "License-First Market Map";

/** On-page reading guide delivered with the report. Not a separate priced file. */
export const READ_REPORT_STEPS = [
  { title: "Executive summary", body: "Start here. It is the short read on whether this state and program shows a real opening." },
  { title: "Who pays", body: "Service model, regulatory class, and funding streams. This is the page that answers “where does the money come from?”" },
  { title: "Licensing path", body: "The roadmap, application steps, and timelines for the program you picked." },
  { title: "People and place", body: "Administrator, staff, training, facility, and equipment requirements." },
  { title: "Rates and startup", body: "Reimbursement notes, competitive landscape, startup costs, and the phase-by-phase timeline." },
] as const;

export const MRR_BULLETS = [
  "Executive Summary with key market indicators and financial opportunity analysis",
  "Complete service model breakdown with regulatory classifications and funding streams",
  "Full licensing roadmap with the application process and timelines",
  "Administrator and staff requirements with certifications and training",
  "Reimbursement rates, billing requirements, and revenue notes",
  "Referral pipeline development with relationship-building steps",
  "Facility and equipment requirements",
  "Market trends, competitive landscape, and positioning",
  "Startup cost analysis with financial projections",
  "Implementation timeline with phase-by-phase steps",
] as const;

export type FunnelBundle = CheckoutProduct & {
  id: string;
  product_slug: string;
  name: string;
  code: string;
  state: string;
  program: string;
};

export type FunnelLineItem = {
  product_slug: string;
  product_id: string;
  name: string;
  price: number;
  quantity: 1;
  purchased_item: string;
  purchased_item_price: number;
  state: string;
  type: string;
};

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Front-end checkout is the $47 report only. The Launch Kit is a separate charge after payment. */
export function funnelContentIds(): string[] {
  return [CONTENT_MRR];
}

export function funnelTotalDollars(): number {
  return MRR_PRICE_DOLLARS;
}

export function creditExpiresAt(purchasedAtMs: number): number {
  return purchasedAtMs + CREDIT_WINDOW_MS;
}

export function creditActive(purchasedAtMs: number, now = Date.now()): boolean {
  return Number.isFinite(purchasedAtMs) && now <= creditExpiresAt(purchasedAtMs);
}

export function creditExpiresIso(stripeCreatedSeconds: number): string {
  return new Date(creditExpiresAt(stripeCreatedSeconds * 1000)).toISOString();
}

/** $647 while the report credit is open, otherwise the $997 kit price. */
export function upsellAmountCents(purchasedAtMs: number, now = Date.now()): number {
  const dollars = creditActive(purchasedAtMs, now) ? UPSELL_PRICE_DOLLARS : LAUNCH_KIT_PRICE_DOLLARS;
  return dollars * 100;
}

/**
 * What the buyer pays for the Launch Kit on the post-pay thank-you offer.
 * The charge is the $647 OTO. This sentence does not restate the $997 catalog
 * price or the retired $950 / $847 credit math.
 */
export function thankYouLaunchKitOffer(): string {
  return `You pay ${formatUsd(UPSELL_PRICE_DOLLARS)} for the Launch Kit. Your ${formatUsd(MRR_CREDIT_DOLLARS)} report credit is applied — about ${formatUsd(UPSELL_SAVINGS_DOLLARS)} off.`;
}

/** Stripe line the buyer sees when paying that same post-pay Launch Kit charge. */
export function upsellCheckoutDescription(): string {
  return `Care Business Launch Kit. You pay ${formatUsd(UPSELL_PRICE_DOLLARS)}.`;
}

/** One line: the $47 report. The how-to-read checklist is on-page copy, not a second SKU. */
export function buildFunnelItems(bundle: FunnelBundle): FunnelLineItem[] {
  return [
    {
      product_slug: bundle.product_slug,
      product_id: bundle.id,
      name: checkoutDisplayName(
        {
          product_slug: bundle.product_slug,
          purchased_item: MRR_PURCHASED_ITEM,
          state: bundle.code,
          type: bundle.program,
        },
        bundle,
      ),
      price: MRR_PRICE_DOLLARS,
      quantity: 1,
      purchased_item: MRR_PURCHASED_ITEM,
      purchased_item_price: MRR_PRICE_DOLLARS,
      state: bundle.code,
      type: bundle.program,
    },
  ];
}

/** Full kit, no purchased_item, so delivery unlocks every file in the bundle. */
export function buildLaunchKitItem(bundle: FunnelBundle, priceDollars: number) {
  return {
    product_slug: bundle.product_slug,
    product_id: bundle.id,
    name: checkoutDisplayName(
      { product_slug: bundle.product_slug, state: bundle.code, type: bundle.program },
      bundle,
    ),
    price: priceDollars,
    quantity: 1,
    state: bundle.code,
    type: bundle.program,
  };
}

export function launchKitHref(code: string, program: string): string {
  const params = new URLSearchParams();
  if (code) params.set("state", code);
  if (program) params.set("type", program);
  const qs = params.toString();
  return qs ? `/launch-kit?${qs}` : "/launch-kit";
}

export function thankYouHref(
  sessionId: string,
  extra?: { upsellPi?: string; upsellSession?: string; declined?: boolean },
): string {
  const params = new URLSearchParams({ session_id: sessionId });
  if (extra?.upsellPi) params.set("upsell_pi", extra.upsellPi);
  if (extra?.upsellSession) params.set("upsell_session", extra.upsellSession);
  if (extra?.declined) params.set("declined", "1");
  return `/market-research/thank-you?${params.toString()}`;
}

export function checkoutHref(code: string, program: string, currentSearch = ""): string {
  const params = new URLSearchParams(currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch);
  if (code) params.set("state", code);
  else params.delete("state");
  if (program) params.set("type", program);
  else params.delete("type");
  params.delete("program");
  const qs = params.toString();
  return qs ? `/market-research/checkout?${qs}` : "/market-research/checkout";
}

/** YouTube, Loom, and Vimeo links become embed URLs. Anything else is ignored. */
export function toEmbedUrl(raw: string | null | undefined): string | null {
  const value = (raw || "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith("loom.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
    if (host.endsWith("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

function originOf(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Success URL Stripe will redirect to. The session placeholder must stay literal. */
export function isFunnelSuccessUrl(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (!allowedOrigins.some((origin) => originOf(origin) === parsed.origin)) return false;
    return parsed.pathname === "/market-research/upsell" && parsed.searchParams.get("session_id") === "{CHECKOUT_SESSION_ID}";
  } catch {
    return false;
  }
}

export function isFunnelCancelUrl(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (!allowedOrigins.some((origin) => originOf(origin) === parsed.origin)) return false;
    return parsed.pathname === "/market-research" || parsed.pathname === "/market-research/checkout";
  } catch {
    return false;
  }
}

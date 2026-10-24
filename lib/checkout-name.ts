/**
 * Name shown on Stripe Checkout for one cart line.
 *
 * The browser sends item.name, but that value is not the product. Live
 * sessions have stored "x" for real bundles (the buyer still pays the
 * catalog price) and a single-resource label such as "Pro Forma P&L Template"
 * on a *-complete-bundle slug. Checkout must name the product the slug
 * actually is. Prices are decided elsewhere and are not touched here.
 */

import { STATE_NAMES } from "./us-states";

const STRIPE_NAME_MAX = 250;
const COURSE_SLUG = "course-operational-success-academy";
const COURSE_NAME = "Care Licensing Solutions Operational Success Academy";
const BUNDLE_FALLBACK = "Complete State Licensing Bundle";
const RESOURCE_FALLBACK = "Licensing Resource";

/** Labels used when one file is bought out of a state bundle. */
const SINGLE_ITEM_NAMES = [
  "Market Research Report",
  "Policy & Procedure Manual",
  "Pro Forma P&L Template",
  "Licensing Checklist",
];

/** Program values on non-bundle catalog rows. Not a buyer's state program. */
const GENERIC_PROGRAMS = new Set([
  "general",
  "financial",
  "licensing",
  "research",
  "policies",
  "course",
  "market research",
]);

const UNUSABLE_NAME = /^(x+|n\/a|na|none|null|undefined|item|product|test|tbd|todo|-)$/i;

const SLUG_TOKEN: Record<string, string> = {
  dd: "(DD)",
  snf: "(SNF)",
  pl: "P&L",
};

export type CheckoutProduct = {
  name?: string | null;
  product_slug?: string | null;
  state?: string | null;
  program?: string | null;
  product_label?: string | null;
  code?: string | null;
};

/** Empty when the string must never be shown on a payment page. */
export function usableCheckoutName(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 3 || UNUSABLE_NAME.test(trimmed)) return "";
  return trimmed;
}

function isSingleItemName(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return SINGLE_ITEM_NAMES.some((label) => label.toLowerCase() === normalized);
}

function expandState(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "general") return "";
  return STATE_NAMES[trimmed.toUpperCase()] || trimmed;
}

function realProgram(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed || GENERIC_PROGRAMS.has(trimmed.toLowerCase()) || isSingleItemName(trimmed)) return "";
  return trimmed;
}

/** missouri-hospice-programs-complete-bundle → Missouri Hospice Programs Complete Bundle */
export function humanizeProductSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .split("-")
    .filter(Boolean)
    .map((word) => SLUG_TOKEN[word] || word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
}

function slugOf(item: any, product: CheckoutProduct | null): string {
  const candidates = [item?.product_slug, product?.product_slug, item?.id];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (trimmed && !trimmed.endsWith("-sample")) return trimmed;
  }
  return "";
}

function bundleFromGenericId(id: string): { state: string; program: string } | null {
  const match = /^bundle-([A-Za-z]{2})-(.+)$/.exec(id.trim());
  if (!match) return null;
  const state = expandState(match[1]);
  const program = realProgram(match[2]);
  if (!state || !program) return null;
  return { state, program };
}

function stateAndProgram(item: any, product: CheckoutProduct | null, slug: string): { state: string; program: string } {
  const fromId =
    bundleFromGenericId(typeof item?.id === "string" ? item.id : "") ||
    bundleFromGenericId(slug);
  return {
    state: expandState(product?.state) || expandState(item?.state) || fromId?.state || "",
    program: realProgram(product?.program) || realProgram(item?.type) || fromId?.program || "",
  };
}

function cap(name: string): string {
  const usable = usableCheckoutName(name);
  const chosen = usable || RESOURCE_FALLBACK;
  return chosen.length > STRIPE_NAME_MAX ? chosen.slice(0, STRIPE_NAME_MAX).trim() : chosen;
}

/**
 * Human-readable Stripe product name for this cart line.
 * `product` is the catalog row for the slug being charged, when one exists.
 */
export function checkoutDisplayName(item: any, product: CheckoutProduct | null): string {
  const id = typeof item?.id === "string" ? item.id : "";
  if (id.endsWith("-sample")) {
    return cap(usableCheckoutName(item?.name) || "Sample Resource");
  }

  const slug = slugOf(item, product);
  const purchased = usableCheckoutName(item?.purchased_item);
  const catalog = usableCheckoutName(product?.name);
  const client = usableCheckoutName(item?.name);
  const { state, program } = stateAndProgram(item, product, slug);
  const bundleSlug = slug.endsWith("-complete-bundle") || slug.startsWith("bundle-");
  const catalogIsThisBundle = !!catalog && !(bundleSlug && isSingleItemName(catalog));

  // One file from a state bundle. The slug stays the bundle (that's where the
  // file lives) but the payment page must name the state, program, and file.
  if (purchased) {
    if (state && program) return cap(`${state} ${program} — ${purchased}`);
    if (catalog && !isSingleItemName(catalog)) return cap(`${catalog} — ${purchased}`);
    return cap(purchased);
  }

  if (catalogIsThisBundle) return cap(catalog);

  if (slug === COURSE_SLUG || id === COURSE_SLUG) return cap(COURSE_NAME);

  if (state && program && (bundleSlug || !client || isSingleItemName(client))) {
    return cap(`${state} ${program} Complete Bundle`);
  }

  if (bundleSlug && !slug.startsWith("bundle-")) {
    const fromSlug = humanizeProductSlug(slug);
    if (usableCheckoutName(fromSlug) && !isSingleItemName(fromSlug)) return cap(fromSlug);
  }

  if (client && !(bundleSlug && isSingleItemName(client))) return cap(client);

  if (slug && !slug.startsWith("bundle-")) {
    const fromSlug = humanizeProductSlug(slug);
    if (usableCheckoutName(fromSlug)) return cap(fromSlug);
  }

  if (bundleSlug) return cap(BUNDLE_FALLBACK);
  return cap(RESOURCE_FALLBACK);
}

/**
 * State-only $997 pack. Buyers pick a state and unlock every program pack
 * for that state, plus Skool. The $47 report checkout and the shop's $397
 * report price stay on their own paths.
 *
 * URLs carry the state code and ad params only. Program display names stay
 * off the query string (same rule as the rest of the Meta funnel).
 */
import { BUNDLE_RESOURCES } from "./bundle-offer";
import { LAUNCH_KIT_PRICE_DOLLARS } from "./meta-funnel";
import { INDIVIDUAL_ITEM_PRICES } from "./pricing";
import { TRACKING_KEYS } from "./tracking-params";
import { STATE_NAMES } from "./us-states";

export const STATE_PACK_FUNNEL = "state_pack" as const;
export const STATE_PACK_PRICE_DOLLARS = LAUNCH_KIT_PRICE_DOLLARS;
export const CONTENT_STATE_PACK = "state_pack_997";
export const STATE_PACK_CHECKOUT_PATH = "/market-research/state";
export const STATE_PACK_THANK_YOU_PATH = "/market-research/state/thank-you";

const DROPPED_QUERY = ["type", "program", "p"] as const;

export class StatePackError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "StatePackError";
    this.status = status;
  }
}

export function parseStatePackCode(state: unknown): string {
  const code = String(state || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || !STATE_NAMES[code]) {
    throw new StatePackError("Choose a state.");
  }
  return code;
}

export function statePackStateName(code: string, fallback?: string | null): string {
  const named = (fallback || "").trim();
  return named || STATE_NAMES[code] || code;
}

function searchParamsOf(currentSearch: string): URLSearchParams {
  return new URLSearchParams(currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch);
}

/** Checkout path with the state code, promo, and ad params. Program params are dropped. */
export function statePackHref(code: string, currentSearch = ""): string {
  const incoming = searchParamsOf(currentSearch);
  const params = new URLSearchParams();
  const normalized = code.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(normalized)) params.set("state", normalized);
  const promo = incoming.get("promo")?.trim();
  if (promo) params.set("promo", promo);
  for (const key of TRACKING_KEYS) {
    const value = incoming.get(key);
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${STATE_PACK_CHECKOUT_PATH}?${qs}` : STATE_PACK_CHECKOUT_PATH;
}

/**
 * Stripe success path. The session placeholder is concatenated so URLSearchParams
 * cannot encode the braces.
 */
export function statePackSuccessPath(currentSearch = ""): string {
  const incoming = searchParamsOf(currentSearch);
  const params = new URLSearchParams();
  for (const key of TRACKING_KEYS) {
    const value = incoming.get(key);
    if (value) params.set(key, value);
  }
  const tracking = params.toString();
  return `${STATE_PACK_THANK_YOU_PATH}?session_id={CHECKOUT_SESSION_ID}${tracking ? `&${tracking}` : ""}`;
}

function originOf(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function sameOrigin(url: URL, allowedOrigins: string[]): boolean {
  return allowedOrigins.some((origin) => originOf(origin) === url.origin);
}

function hasProgramQuery(url: URL): boolean {
  return DROPPED_QUERY.some((key) => url.searchParams.has(key));
}

export function isStatePackSuccessUrl(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (!sameOrigin(parsed, allowedOrigins)) return false;
    if (parsed.pathname !== STATE_PACK_THANK_YOU_PATH) return false;
    if (parsed.searchParams.get("session_id") !== "{CHECKOUT_SESSION_ID}") return false;
    if (hasProgramQuery(parsed)) return false;
    return true;
  } catch {
    return false;
  }
}

export function isStatePackCancelUrl(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (!sameOrigin(parsed, allowedOrigins)) return false;
    if (parsed.pathname !== STATE_PACK_CHECKOUT_PATH) return false;
    if (hasProgramQuery(parsed)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Drop program query params before a URL is stored for Meta. */
export function opaqueStatePackUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.pathname !== STATE_PACK_CHECKOUT_PATH && url.pathname !== STATE_PACK_THANK_YOU_PATH) return "";
    for (const key of DROPPED_QUERY) url.searchParams.delete(key);
    url.hash = "";
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return "";
  }
}

/**
 * Separate-file prices for one program pack. Null when any kit file has no
 * price in INDIVIDUAL_ITEM_PRICES, so the page never invents a number.
 * Skool is not in that table and is not given a dollar value.
 */
export function statePackFilePrices(): { label: string; price: number }[] | null {
  const lines: { label: string; price: number }[] = [];
  for (const label of BUNDLE_RESOURCES) {
    const price = INDIVIDUAL_ITEM_PRICES[label];
    if (typeof price !== "number" || price <= 0) return null;
    lines.push({ label, price });
  }
  return lines;
}

export function statePackPerPackTotal(): number | null {
  const lines = statePackFilePrices();
  if (!lines) return null;
  return lines.reduce((sum, line) => sum + line.price, 0);
}

/** N packs × the four file prices. Null until a state with at least one pack is chosen. */
export function statePackSeparateTotal(programCount: number): number | null {
  const perPack = statePackPerPackTotal();
  if (perPack == null || !Number.isInteger(programCount) || programCount < 1) return null;
  return perPack * programCount;
}

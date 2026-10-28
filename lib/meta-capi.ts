import { createHash } from "node:crypto";
import { SITE_URL } from "@/lib/seo";

/**
 * Meta Conversions API for the market-research funnel.
 * Purchase uses the Checkout Session id (hosted checkout) or PaymentIntent id
 * (one-click Launch Kit). The browser pixel sends that same eventID so Events
 * Manager can dedupe. A $0 checkout is not a Purchase unless META_CAPI_TEST_EVENT_CODE
 * is set, and then it is a Test Event only. Missing env is a no-op: checkout still fulfills.
 */
export const META_CAPI_TOKEN_ENV = "META_CAPI_ACCESS_TOKEN";
export const META_CAPI_TEST_ENV = "META_CAPI_TEST_EVENT_CODE";

/** Stripe metadata keys. Values are capped at Stripe's 500-character limit. */
export const META_ATTR_FBP = "meta_fbp";
export const META_ATTR_FBC = "meta_fbc";
export const META_ATTR_IP = "meta_ip";
export const META_ATTR_UA = "meta_ua";
export const META_ATTR_URL = "meta_url";
export const META_CAPI_SENT = "meta_capi_purchase";

const GRAPH_VERSION = "v23.0";
const META_VALUE_MAX = 490;

export function metaCapiPixelId(): string {
  const candidates = [process.env.NEXT_PUBLIC_META_PIXEL_ID, process.env.META_PIXEL_ID];
  for (const raw of candidates) {
    const id = (raw || "").trim();
    if (/^\d{5,20}$/.test(id)) return id;
  }
  return "";
}

export function metaCapiAccessToken(): string {
  return (process.env.META_CAPI_ACCESS_TOKEN || "").trim();
}

/** Events Manager → Test Events code. When set, CAPI events are not used for ad optimization. */
export function metaCapiTestEventCode(): string {
  const code = (process.env[META_CAPI_TEST_ENV] || "").trim();
  return /^TEST[A-Za-z0-9_-]{1,40}$/.test(code) ? code : "";
}

/** Meta email: trim and lowercase. */
export function normalizeMetaEmail(raw: string | null | undefined): string {
  const value = (raw || "").trim().toLowerCase();
  if (!value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return "";
  return value;
}

/**
 * Meta phone: digits only, with country code, no symbols or leading zeros.
 * A 10-digit US number gets a leading 1.
 */
export function normalizeMetaPhone(raw: string | null | undefined): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) digits = `1${digits}`;
  digits = digits.replace(/^0+/, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return digits;
}

/** Meta name: lowercase a-z. Punctuation and spaces are removed before hashing. */
export function normalizeMetaName(raw: string | null | undefined): string {
  return (raw || "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

export function hashMeta(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

export function hashMetaField(
  normalize: (raw: string | null | undefined) => string,
  raw: string | null | undefined,
): string | null {
  const value = normalize(raw);
  return value ? hashMeta(value) : null;
}

export function splitPersonName(name: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

export type MetaBrowserContext = {
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  sourceUrl?: string | null;
};

export function sanitizeFbp(raw: string | null | undefined): string {
  const value = (raw || "").trim();
  if (!/^fb\.\d+\.\d+\.[A-Za-z0-9._-]{1,180}$/.test(value)) return "";
  return value.length <= 200 ? value : "";
}

export function sanitizeFbc(raw: string | null | undefined): string {
  const value = (raw || "").trim();
  if (!/^fb\.\d+\.\d+\.[A-Za-z0-9._-]{5,420}$/.test(value)) return "";
  return value.length <= META_VALUE_MAX ? value : "";
}

/** Browser pixel blocked: build _fbc from the ad click id on the landing URL. */
export function fbcFromFbclid(raw: string | null | undefined, nowMs = Date.now()): string {
  const fbclid = (raw || "").trim();
  if (!/^[A-Za-z0-9._-]{5,240}$/.test(fbclid)) return "";
  return sanitizeFbc(`fb.1.${nowMs}.${fbclid}`);
}

export function sanitizeIp(raw: string | null | undefined): string {
  let value = (raw || "").trim();
  if (value.toLowerCase().startsWith("::ffff:")) value = value.slice(7);
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    const ok = value.split(".").every((part) => {
      const n = Number(part);
      return n >= 0 && n <= 255 && String(n) === String(Number(part));
    });
    return ok ? value : "";
  }
  if (/^[0-9a-fA-F:]{2,45}$/.test(value) && value.includes(":")) return value;
  return "";
}

export function clientIpFromHeaders(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "";
  return sanitizeIp(first);
}

export function sanitizeUa(raw: string | null | undefined): string {
  const value = (raw || "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (value.length < 8) return "";
  return value.slice(0, META_VALUE_MAX);
}

export function sanitizeSourceUrl(raw: string | null | undefined, allowedOrigins: string[] = []): string {
  const value = (raw || "").trim();
  if (!value) return "";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "";
  const allowed = new Set<string>(["carelicensingsolution.com", "www.carelicensingsolution.com", "localhost", "127.0.0.1"]);
  for (const origin of [SITE_URL, ...allowedOrigins]) {
    try {
      allowed.add(new URL(origin).hostname.toLowerCase());
    } catch {
      // Ignore a bad configured origin. The public site host is still allowed.
    }
  }
  if (!allowed.has(url.hostname.toLowerCase())) return "";
  if (!url.pathname.startsWith("/market-research")) return "";
  url.hash = "";
  url.username = "";
  url.password = "";
  const full = url.toString();
  if (full.length <= META_VALUE_MAX) return full;
  url.search = "";
  const short = url.toString();
  return short.length <= META_VALUE_MAX ? short : "";
}

export function metaContextFromRequest(
  request: { headers: { get(name: string): string | null } },
  body: unknown,
): MetaBrowserContext {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const text = (key: string) => (typeof record[key] === "string" ? (record[key] as string) : "");
  return {
    fbp: text("fbp"),
    fbc: text("fbc"),
    fbclid: text("fbclid"),
    clientIp: clientIpFromHeaders(request.headers),
    userAgent: request.headers.get("user-agent") || "",
    sourceUrl: text("eventSourceUrl"),
  };
}

export function metaAttributionMetadata(
  ctx: MetaBrowserContext | null | undefined,
  allowedOrigins: string[] = [],
): Record<string, string> {
  if (!ctx) return {};
  const out: Record<string, string> = {};
  const fbp = sanitizeFbp(ctx.fbp);
  const fbc = sanitizeFbc(ctx.fbc) || fbcFromFbclid(ctx.fbclid);
  const ip = sanitizeIp(ctx.clientIp);
  const ua = sanitizeUa(ctx.userAgent);
  const url = sanitizeSourceUrl(ctx.sourceUrl, allowedOrigins);
  if (fbp) out[META_ATTR_FBP] = fbp;
  if (fbc) out[META_ATTR_FBC] = fbc;
  if (ip) out[META_ATTR_IP] = ip;
  if (ua) out[META_ATTR_UA] = ua;
  if (url) out[META_ATTR_URL] = url;
  return out;
}

export function attributionFromMetadata(
  metadata: Record<string, string | null | undefined> | null | undefined,
): MetaBrowserContext {
  if (!metadata) return {};
  return {
    fbp: metadata[META_ATTR_FBP] || "",
    fbc: metadata[META_ATTR_FBC] || "",
    clientIp: metadata[META_ATTR_IP] || "",
    userAgent: metadata[META_ATTR_UA] || "",
    sourceUrl: metadata[META_ATTR_URL] || "",
  };
}

export type MetaEventInput = {
  /** Checkout Session id for hosted checkout, PaymentIntent id for the one-click kit. */
  eventId: string;
  eventTime?: number;
  value: number;
  currency?: string;
  contentIds: string[];
  contentName: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  sourceUrl?: string;
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  /**
   * Server-only. $0 Purchase is built only when this is set, and the sender
   * attaches it as test_event_code so the event cannot be optimized on.
   */
  testEventCode?: string | null;
};

export type MetaPurchaseInput = MetaEventInput;

type MetaEventBody = { data: Record<string, unknown>[] };

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function matchUserData(input: MetaEventInput): Record<string, unknown> | null {
  const userData: Record<string, unknown> = {};
  const em = hashMetaField(normalizeMetaEmail, input.email);
  const ph = hashMetaField(normalizeMetaPhone, input.phone);
  const fn = hashMetaField(normalizeMetaName, input.firstName);
  const ln = hashMetaField(normalizeMetaName, input.lastName);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (fn) userData.fn = [fn];
  if (ln) userData.ln = [ln];

  const fbp = sanitizeFbp(input.fbp);
  const fbc = sanitizeFbc(input.fbc) || fbcFromFbclid(input.fbclid);
  const ip = sanitizeIp(input.clientIp);
  const ua = sanitizeUa(input.userAgent);
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  if (ip && ua) {
    userData.client_ip_address = ip;
    userData.client_user_agent = ua;
  }

  const matched = Boolean(userData.em || userData.ph || userData.fbp || userData.fbc || (ip && ua));
  return matched ? userData : null;
}

function eventShell(
  input: MetaEventInput,
  eventName: string,
  sourceFallback: string,
  userData: Record<string, unknown>,
  orderId?: string,
): Record<string, unknown> {
  const eventId = input.eventId.trim();
  const contentIds = input.contentIds.map((id) => id.trim()).filter(Boolean);
  const value = roundMoney(Number(input.value));
  const eventTime = input.eventTime && input.eventTime > 0 ? Math.floor(input.eventTime) : Math.floor(Date.now() / 1000);
  const sourceUrl = sanitizeSourceUrl(input.sourceUrl) || sourceFallback;
  const customData: Record<string, unknown> = {
    currency: (input.currency || "USD").toUpperCase(),
    value,
    content_ids: contentIds,
    content_type: "product",
    content_name: input.contentName,
    num_items: contentIds.length,
    contents: contentIds.map((id) =>
      contentIds.length === 1 ? { id, quantity: 1, item_price: value } : { id, quantity: 1 },
    ),
  };
  if (orderId) customData.order_id = orderId;
  return {
    event_name: eventName,
    event_time: eventTime,
    event_id: eventId,
    action_source: "website",
    event_source_url: sourceUrl,
    user_data: userData,
    custom_data: customData,
  };
}

export function buildMetaPurchaseBody(input: MetaPurchaseInput): MetaEventBody | null {
  const eventId = input.eventId.trim();
  const value = roundMoney(Number(input.value));
  const contentIds = input.contentIds.map((id) => id.trim()).filter(Boolean);
  const testEventCode = (input.testEventCode || "").trim();
  const paid = Number.isFinite(value) && value > 0;
  if (!eventId || contentIds.length === 0) return null;
  if (!paid && !testEventCode) return null;
  if (!paid && !/^TEST[A-Za-z0-9_-]{1,40}$/.test(testEventCode)) return null;

  const userData = matchUserData(input);
  if (!userData) return null;

  return {
    data: [
      eventShell(
        { ...input, value: paid ? value : 0 },
        "Purchase",
        `${SITE_URL}/market-research/thank-you`,
        userData,
        eventId,
      ),
    ],
  };
}

export function buildMetaInitiateCheckoutBody(input: MetaEventInput): MetaEventBody | null {
  const eventId = input.eventId.trim();
  const value = roundMoney(Number(input.value));
  const contentIds = input.contentIds.map((id) => id.trim()).filter(Boolean);
  if (!eventId || contentIds.length === 0 || !Number.isFinite(value) || value < 0) return null;
  const userData = matchUserData(input);
  if (!userData) return null;
  return {
    data: [
      eventShell(
        { ...input, value },
        "InitiateCheckout",
        `${SITE_URL}/market-research/checkout`,
        userData,
      ),
    ],
  };
}

async function postMetaCapi(
  payload: MetaEventBody,
  deps?: { fetchImpl?: typeof fetch },
): Promise<{ sent: boolean; reason: string }> {
  const pixelId = metaCapiPixelId();
  const token = metaCapiAccessToken();
  if (!pixelId || !token) {
    console.warn(
      "Meta CAPI skipped: set META_CAPI_ACCESS_TOKEN and NEXT_PUBLIC_META_PIXEL_ID (or META_PIXEL_ID).",
    );
    return { sent: false, reason: "missing-env" };
  }

  const testEventCode = metaCapiTestEventCode();
  const body = testEventCode ? { ...payload, test_event_code: testEventCode } : payload;
  const fetchImpl = deps?.fetchImpl || fetch;
  try {
    const res = await fetchImpl(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, access_token: token }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Meta CAPI event failed:", res.status, text.slice(0, 300));
      return { sent: false, reason: `http-${res.status}` };
    }
    return { sent: true, reason: "sent" };
  } catch (err) {
    console.error("Meta CAPI event failed:", err instanceof Error ? err.message : "error");
    return { sent: false, reason: "network" };
  }
}

export async function sendMetaCapiPurchase(
  input: MetaPurchaseInput,
  deps?: { fetchImpl?: typeof fetch },
): Promise<{ sent: boolean; reason: string }> {
  const testEventCode = metaCapiTestEventCode();
  const payload = buildMetaPurchaseBody({ ...input, testEventCode });
  if (!payload) {
    if (!(Number(input.value) > 0)) return { sent: false, reason: "unpaid" };
    console.warn("Meta CAPI skipped: purchase is missing a content id or match key.", input.eventId);
    return { sent: false, reason: "incomplete" };
  }
  if (testEventCode && Number(input.value) > 0) {
    console.warn(
      "Meta CAPI test_event_code is set. Paid Purchase events are excluded from ad optimization until it is removed.",
    );
  }
  return postMetaCapi(payload, deps);
}

export async function sendMetaCapiInitiateCheckout(
  input: MetaEventInput,
  deps?: { fetchImpl?: typeof fetch },
): Promise<{ sent: boolean; reason: string }> {
  const payload = buildMetaInitiateCheckoutBody(input);
  if (!payload) {
    console.warn("Meta CAPI skipped: InitiateCheckout is missing an id, content id, or match key.", input.eventId);
    return { sent: false, reason: "incomplete" };
  }
  return postMetaCapi(payload, deps);
}

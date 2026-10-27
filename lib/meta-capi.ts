import { createHash } from "node:crypto";
import { SITE_URL } from "@/lib/seo";

/**
 * Meta Conversions API Purchase events for the $47 report and the $647 Launch Kit.
 * The browser pixel sends the same event_id (Checkout Session id or PaymentIntent id)
 * so Events Manager can dedupe. Missing env is a no-op: checkout still fulfills.
 */
export const META_CAPI_TOKEN_ENV = "META_CAPI_ACCESS_TOKEN";

const GRAPH_VERSION = "v23.0";

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

export type MetaPurchaseInput = {
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
};

export function buildMetaPurchaseBody(input: MetaPurchaseInput): { data: Record<string, unknown>[] } | null {
  const eventId = input.eventId.trim();
  const value = Number(input.value);
  const contentIds = input.contentIds.map((id) => id.trim()).filter(Boolean);
  if (!eventId || !(value > 0) || contentIds.length === 0) return null;

  const userData: Record<string, string[]> = {};
  const em = hashMetaField(normalizeMetaEmail, input.email);
  const ph = hashMetaField(normalizeMetaPhone, input.phone);
  const fn = hashMetaField(normalizeMetaName, input.firstName);
  const ln = hashMetaField(normalizeMetaName, input.lastName);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (fn) userData.fn = [fn];
  if (ln) userData.ln = [ln];
  if (!userData.em && !userData.ph) return null;

  const eventTime = input.eventTime && input.eventTime > 0 ? Math.floor(input.eventTime) : Math.floor(Date.now() / 1000);
  return {
    data: [
      {
        event_name: "Purchase",
        event_time: eventTime,
        event_id: eventId,
        action_source: "website",
        event_source_url: input.sourceUrl || `${SITE_URL}/market-research/thank-you`,
        user_data: userData,
        custom_data: {
          currency: (input.currency || "USD").toUpperCase(),
          value,
          content_ids: contentIds,
          content_type: "product",
          content_name: input.contentName,
          order_id: eventId,
          num_items: contentIds.length,
        },
      },
    ],
  };
}

export async function sendMetaCapiPurchase(
  input: MetaPurchaseInput,
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

  const payload = buildMetaPurchaseBody(input);
  if (!payload) {
    console.warn("Meta CAPI skipped: purchase is missing a value, content id, or email/phone.", input.eventId);
    return { sent: false, reason: "incomplete" };
  }

  const fetchImpl = deps?.fetchImpl || fetch;
  try {
    const res = await fetchImpl(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: token }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Meta CAPI Purchase failed:", res.status, text.slice(0, 300));
      return { sent: false, reason: `http-${res.status}` };
    }
    return { sent: true, reason: "sent" };
  } catch (err) {
    console.error("Meta CAPI Purchase failed:", err instanceof Error ? err.message : "error");
    return { sent: false, reason: "network" };
  }
}

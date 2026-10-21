/**
 * Tag buyers in GoHighLevel so sales sequences stop for people who already bought.
 * Needs a GHL Private Integration token with contacts read/write scope:
 *   GHL_PRIVATE_TOKEN   (Vercel, sensitive)
 *   GHL_LOCATION_ID     (defaults to the ALF Launch sub-account)
 * Without a token this does nothing, so checkout is never affected.
 */
const API = "https://services.leadconnectorhq.com";
const VERSION = "2021-07-28";

export async function tagBuyerInGhl(opts: {
  email: string;
  name?: string | null;
  phone?: string | null;
  tags: string[];
}): Promise<{ ok: boolean; reason: string }> {
  const token = process.env.GHL_PRIVATE_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID || "F5lkC7Gm4ls08iexDcUq";
  if (!token) return { ok: false, reason: "no-token" };
  const headers = {
    Authorization: `Bearer ${token}`,
    Version: VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  try {
    const [firstName, ...rest] = (opts.name || "").trim().split(/\s+/);
    // Upsert finds the existing lead by email (or phone) instead of creating a duplicate.
    const up = await fetch(`${API}/contacts/upsert`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId,
        email: opts.email.trim().toLowerCase(),
        ...(opts.phone ? { phone: opts.phone } : {}),
        ...(firstName ? { firstName, lastName: rest.join(" ") || undefined } : {}),
      }),
    });
    const body = await up.json().catch(() => ({}));
    const id = body?.contact?.id;
    if (!up.ok || !id) return { ok: false, reason: `upsert-${up.status}` };
    // Add tags (this endpoint adds; it never removes the lead's existing tags).
    const tg = await fetch(`${API}/contacts/${id}/tags`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tags: opts.tags }),
    });
    return { ok: tg.ok, reason: tg.ok ? "tagged" : `tags-${tg.status}` };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "error" };
  }
}

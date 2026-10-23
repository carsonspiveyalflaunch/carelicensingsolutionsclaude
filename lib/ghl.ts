/**
 * Tag buyers in GoHighLevel so sales sequences stop for people who already bought.
 * Needs a GHL Private Integration token with contacts read/write scope:
 *   GHL_PRIVATE_TOKEN   (Vercel, sensitive)
 *   GHL_LOCATION_ID     (defaults to the ALF Launch sub-account)
 * Without a token this does nothing, so checkout is never affected.
 */
const API = "https://services.leadconnectorhq.com";
const VERSION = "2021-07-28";

// GHL custom field IDs in the ALF Launch sub-account (used by the CLS follow-up
// workflow and the reply assistant: {{contact.bundle_link}} etc.).
export const GHL_FIELDS = {
  bundleLink: "d3rnxfMEsYNLr7o1nkC5",
  stateName: "wpzqckQkQZx3cdR7uhFF",
  stateCode: "dA8tqbem1qgd0n3eC3ll",
  program: "JUxZeLyzAsipAqlLzKFB",
  programPhrase: "RAhitXA54jDsdhclZSP1",
} as const;

/**
 * Save a website lead to GHL: upsert by email (no duplicates), add tags, and
 * fill the CLS custom fields when we know the state/program they were viewing.
 */
export async function saveLeadInGhl(opts: {
  email?: string | null;
  firstName?: string | null;
  phone?: string | null;
  tags: string[];
  customFields?: { id: string; value: string }[];
}): Promise<{ ok: boolean; reason: string; contactId?: string }> {
  const token = process.env.GHL_PRIVATE_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID || "F5lkC7Gm4ls08iexDcUq";
  if (!token) return { ok: false, reason: "no-token" };
  if (!opts.email && !opts.phone) return { ok: false, reason: "no-contact-info" };
  const headers = {
    Authorization: `Bearer ${token}`,
    Version: VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  try {
    const up = await fetch(`${API}/contacts/upsert`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId,
        ...(opts.email ? { email: opts.email.trim().toLowerCase() } : {}),
        source: "carelicensingsolution.com",
        ...(opts.firstName ? { firstName: opts.firstName.trim() } : {}),
        ...(opts.phone ? { phone: opts.phone } : {}),
        ...(opts.customFields?.length ? { customFields: opts.customFields.map((f) => ({ id: f.id, field_value: f.value })) } : {}),
      }),
    });
    const body = await up.json().catch(() => ({}));
    const id = body?.contact?.id;
    if (!up.ok || !id) return { ok: false, reason: `upsert-${up.status}` };
    const tg = await fetch(`${API}/contacts/${id}/tags`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tags: opts.tags }),
    });
    return { ok: tg.ok, reason: tg.ok ? "saved" : `tags-${tg.status}`, contactId: id };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "error" };
  }
}

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

/**
 * Send one SMS to a contact from the location's default number. Used when a
 * visitor asks the site chat assistant to text them their bundle link.
 */
export async function sendSmsInGhl(contactId: string, message: string): Promise<{ ok: boolean; reason: string }> {
  const token = process.env.GHL_PRIVATE_TOKEN;
  if (!token) return { ok: false, reason: "no-token" };
  try {
    const res = await fetch(`${API}/conversations/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-04-15",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ type: "SMS", contactId, message }),
    });
    if (res.ok) return { ok: true, reason: "sent" };
    const err = await res.text().catch(() => "");
    return { ok: false, reason: `sms-${res.status} ${err.slice(0, 200)}` };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "error" };
  }
}

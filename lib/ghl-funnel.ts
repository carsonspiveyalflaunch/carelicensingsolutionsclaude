/**
 * GoHighLevel contact sync for the $47 market-research funnel.
 * Called from the existing Stripe webhook (checkout.session.completed) and from
 * the one-click Launch Kit PaymentIntent fulfillment. Missing env never throws.
 *
 * Tags are added with POST /contacts/:id/tags (adds; does not replace existing tags).
 * HighLevel creates a tag the first time it is applied:
 *   mrr-buyer
 *   launch-kit-buyer          (Launch Kit payment only)
 *   mrr-state-{code}          e.g. mrr-state-az
 *   mrr-program-{alias}       e.g. mrr-program-dd-group-home
 *
 * Custom fields use the existing ALF Launch field IDs in GHL_FIELDS
 * (state name, state code, program, program phrase).
 */
import { PROGRAM_ALIASES, PROGRAM_HEADLINE } from "./go-links";
import { GHL_FIELDS, ghlCredentials, tagBuyerInGhl } from "./ghl";

export const MRR_BUYER_TAG = "mrr-buyer";
export const LAUNCH_KIT_BUYER_TAG = "launch-kit-buyer";

const MISSING_TOKEN_LOG =
  "GHL buyer sync skipped: set GHL_API_KEY or GHL_PRIVATE_TOKEN (Private Integration token with contacts.write). GHL_LOCATION_ID is optional and defaults to the ALF Launch location F5lkC7Gm4ls08iexDcUq. Purchase delivery continues.";

export function funnelBuyerTags(input: {
  launchKit: boolean;
  state?: string | null;
  program?: string | null;
}): string[] {
  const tags = [MRR_BUYER_TAG];
  if (input.launchKit) tags.push(LAUNCH_KIT_BUYER_TAG);
  const state = (input.state || "").trim().toLowerCase();
  if (/^[a-z]{2}$/.test(state)) tags.push(`mrr-state-${state}`);
  const programTag = programTagFor(input.program);
  if (programTag) tags.push(programTag);
  return tags;
}

function programTagFor(program?: string | null): string | null {
  const raw = (program || "").trim();
  if (!raw) return null;
  const alias = PROGRAM_ALIASES[raw];
  const slug = (alias || raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug ? `mrr-program-${slug}` : null;
}

export function funnelBuyerCustomFields(input: {
  state?: string | null;
  stateName?: string | null;
  program?: string | null;
}): { id: string; value: string }[] {
  const state = (input.state || "").trim().toUpperCase();
  const program = (input.program || "").trim();
  const stateName = (input.stateName || "").trim();
  const fields: { id: string; value: string }[] = [];
  if (stateName) fields.push({ id: GHL_FIELDS.stateName, value: stateName });
  if (/^[A-Z]{2}$/.test(state)) fields.push({ id: GHL_FIELDS.stateCode, value: state });
  if (program) {
    fields.push({ id: GHL_FIELDS.program, value: program });
    const phrase = (PROGRAM_HEADLINE[program] || program).toLowerCase();
    if (phrase) fields.push({ id: GHL_FIELDS.programPhrase, value: phrase });
  }
  return fields;
}

export async function syncFunnelBuyerInGhl(opts: {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  state?: string | null;
  stateName?: string | null;
  program?: string | null;
  launchKit: boolean;
  extraTags?: string[];
}): Promise<{ ok: boolean; reason: string }> {
  const email = (opts.email || "").trim();
  if (!email) {
    console.warn("GHL buyer sync skipped: no email on the Stripe payment. Purchase delivery continues.");
    return { ok: false, reason: "no-email" };
  }
  if (!ghlCredentials()) {
    console.warn(MISSING_TOKEN_LOG);
    return { ok: false, reason: "no-token" };
  }

  const tags = [...new Set([...(opts.extraTags || []), ...funnelBuyerTags(opts)])];
  const customFields = funnelBuyerCustomFields(opts);
  try {
    const tagged = await tagBuyerInGhl({
      email,
      name: opts.name,
      phone: opts.phone,
      tags,
      customFields,
    });
    if (tagged.ok || !customFields.length || !tagged.reason.startsWith("upsert-")) return tagged;
    console.warn("GHL upsert with state/program fields failed; retrying tags only:", tagged.reason);
    return tagBuyerInGhl({ email, name: opts.name, phone: opts.phone, tags });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "error";
    console.error("GHL buyer sync failed:", reason);
    return { ok: false, reason };
  }
}

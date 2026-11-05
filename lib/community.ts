// Private Skool community every bundle buyer gets access to.
export const SKOOL_COMMUNITY_URL = "https://www.skool.com/carelicensingsolutions";

/**
 * Same invite the course success page already shows buyers.
 * SKOOL_INVITE_URL (or NEXT_PUBLIC_SKOOL_INVITE_URL) replaces it.
 * The state-pack receipt and thank-you use this when the Zapier hook is unset.
 */
const DEFAULT_SKOOL_INVITE_URL =
  "https://www.skool.com/carelicensingsolutions?invite=c486b98509704b52a9a0ba10e535c2ba";

export function skoolInviteUrl(): string {
  const configured = (process.env.SKOOL_INVITE_URL || process.env.NEXT_PUBLIC_SKOOL_INVITE_URL || "").trim();
  if (/^https:\/\/[\w.-]*skool\.com\/\S+$/i.test(configured)) return configured;
  return DEFAULT_SKOOL_INVITE_URL;
}

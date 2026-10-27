import { SITE_URL } from "@/lib/seo";

/**
 * Business details used on the Terms, Refund and Privacy pages and in the
 * checkout agreement text. Change them here and every page updates.
 * LEGAL_ENTITY: replace with the registered business name (e.g. "Care
 * Licensing Solutions LLC") once confirmed.
 */
export const LEGAL_ENTITY = "Care Licensing Solutions";
export const LEGAL_EMAIL = "support@carelicensingsolution.com";
export const LEGAL_ADDRESS = "2404 Valley Mill Rd, El Cajon, CA 92020";
export const LEGAL_PHONE = "(619) 834-9680";
export const LEGAL_EFFECTIVE_DATE = "October 20, 2026";
export const LEGAL_VENUE = "San Diego County, California";

export const TERMS_URL = `${SITE_URL}/terms`;
export const REFUND_URL = `${SITE_URL}/refund-policy`;
export const PRIVACY_URL = `${SITE_URL}/privacy`;

/** Shown directly above the Pay button on Stripe Checkout. */
export const CHECKOUT_AGREEMENT_TEXT =
  `By completing this purchase you agree to our [Terms of Service](${TERMS_URL}) and [Refund Policy](${REFUND_URL}). ` +
  `These are digital products delivered instantly, so all sales are final once access is delivered, except as stated in the Refund Policy.`;

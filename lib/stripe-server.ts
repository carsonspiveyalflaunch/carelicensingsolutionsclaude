import Stripe from "stripe";

/** Same API version as the existing checkout and webhook handlers. */
export const STRIPE_API_VERSION = "2026-02-25.clover" as const;

let stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe;
  stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
    : null;
  return stripe;
}

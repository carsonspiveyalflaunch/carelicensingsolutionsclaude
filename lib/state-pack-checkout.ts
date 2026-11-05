import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { listCompleteBundlesForState } from "@/lib/complete-bundles";
import { FunnelOrderError, resolveServerPromo } from "@/lib/funnel-checkout";
import { FunnelPromoError } from "@/lib/funnel-promo";
import { metaAttributionMetadata, type MetaBrowserContext } from "@/lib/meta-capi";
import { reportInitiateCheckout } from "@/lib/meta-report";
import {
  buildStatePackItems,
  buildStatePackSessionParams,
  readStatePackPromo,
  statePackProductName,
} from "@/lib/state-pack";
import {
  CONTENT_STATE_PACK,
  STATE_PACK_FUNNEL,
  STATE_PACK_PRICE_DOLLARS,
  STATE_PACK_THANK_YOU_PATH,
  StatePackError,
  isStatePackCancelUrl,
  isStatePackSuccessUrl,
  opaqueStatePackUrl,
  parseStatePackCode,
  statePackHref,
  statePackStateName,
} from "@/lib/state-pack-shared";
import { withCleanFunnelSearch } from "@/lib/program-codes";

function allowedOrigins(requestOrigin: string): string[] {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return [requestOrigin, site].filter(Boolean);
}

function asOrderError(err: unknown): FunnelOrderError | null {
  if (err instanceof FunnelOrderError) return err;
  if (err instanceof StatePackError) return new FunnelOrderError(err.message, err.status);
  if (err instanceof FunnelPromoError) return new FunnelOrderError(err.message, err.status);
  return null;
}

export async function createStatePackCheckout(
  stripe: Stripe,
  supabase: SupabaseClient,
  input: {
    state?: unknown;
    promotionCode?: unknown;
    promoCode?: unknown;
    promo?: unknown;
    successUrl?: unknown;
    cancelUrl?: unknown;
    userId?: string | null;
    requestOrigin: string;
    meta?: MetaBrowserContext;
  },
): Promise<{ url: string; sessionId: string; amount: number; contentIds: string[] }> {
  let code: string;
  let requestedPromo: string | null;
  try {
    code = parseStatePackCode(input.state);
    requestedPromo = readStatePackPromo(input);
  } catch (err) {
    const orderError = asOrderError(err);
    if (orderError) throw orderError;
    throw err;
  }

  const bundles = await listCompleteBundlesForState(supabase, code);
  if (!bundles.length) throw new FunnelOrderError("That state isn't available yet.");
  const items = buildStatePackItems(bundles);
  const total = STATE_PACK_PRICE_DOLLARS;
  const applied = requestedPromo ? await resolveServerPromo(stripe, requestedPromo, total) : null;
  const charged = applied ? applied.total : total;
  const origins = allowedOrigins(input.requestOrigin);
  const origin = origins[0];
  const stateName = statePackStateName(code, bundles[0]?.state);

  const successUrl =
    typeof input.successUrl === "string" && isStatePackSuccessUrl(input.successUrl, origins)
      ? input.successUrl
      : `${origin}${STATE_PACK_THANK_YOU_PATH}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelFallback = `${origin}${statePackHref(code, applied?.code ? `promo=${encodeURIComponent(applied.code)}` : "")}`;
  const cancelUrl = withCleanFunnelSearch(
    typeof input.cancelUrl === "string" && isStatePackCancelUrl(input.cancelUrl, origins)
      ? input.cancelUrl
      : cancelFallback,
  );
  const sourceUrl =
    opaqueStatePackUrl(input.meta?.sourceUrl || "") || `${origin}${statePackHref(code)}`;

  const sessionParams = (opts: { paymentIntent: boolean; collectIfRequired: boolean }) =>
    buildStatePackSessionParams({
      code,
      stateName,
      items,
      applied,
      charged,
      subtotal: total,
      userId: input.userId,
      attribution: metaAttributionMetadata({ ...(input.meta || {}), sourceUrl }, origins),
      successUrl,
      cancelUrl,
      ...opts,
    });

  const zeroDue = applied?.zeroDue === true;
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      sessionParams({ paymentIntent: !zeroDue, collectIfRequired: true }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/customer_creation|payment_method_collection|payment_intent_data|billing_address/i.test(message)) {
      throw err;
    }
    console.warn("State pack checkout retrying without payment intent data:", message);
    session = await stripe.checkout.sessions.create(
      sessionParams({
        paymentIntent:
          !zeroDue &&
          !/(unknown parameter: payment_intent_data|cannot (provide|pass|include|set) payment_intent_data)/i.test(message),
        collectIfRequired: !/payment_method_collection/i.test(message),
      }),
    );
  }

  if (!session.url) throw new FunnelOrderError("Checkout could not start.", 500);
  await reportInitiateCheckout({
    eventId: session.id,
    value: charged,
    currency: "usd",
    contentIds: [CONTENT_STATE_PACK],
    contentName: statePackProductName(stateName),
    sourceUrl,
    fbp: input.meta?.fbp,
    fbc: input.meta?.fbc,
    fbclid: input.meta?.fbclid,
    clientIp: input.meta?.clientIp,
    userAgent: input.meta?.userAgent,
  });
  return {
    url: session.url,
    sessionId: session.id,
    amount: charged,
    contentIds: [CONTENT_STATE_PACK],
  };
}

export async function loadPaidStatePackSession(stripe: Stripe, sessionId: string): Promise<Stripe.Checkout.Session> {
  if (!/^cs_(test|live)_/.test(sessionId)) throw new FunnelOrderError("Unknown checkout.");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.funnel !== STATE_PACK_FUNNEL) {
    throw new FunnelOrderError("Unknown checkout.", 404);
  }
  if (session.status !== "complete" || !["paid", "no_payment_required"].includes(session.payment_status)) {
    throw new FunnelOrderError("Payment isn't complete yet.", 402);
  }
  return session;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { listBundleAssets } from "@/lib/bundle-files";
import { findCompleteBundle, type CompleteBundle } from "@/lib/complete-bundles";
import { queueFunnelEmail } from "@/lib/funnel-email";
import { CHECKOUT_AGREEMENT_TEXT } from "@/lib/legal";
import { metaAttributionMetadata, splitPersonName, type MetaBrowserContext } from "@/lib/meta-capi";
import { reportInitiateCheckout } from "@/lib/meta-report";
import {
  CONTENT_LAUNCH_KIT,
  CONTENT_MRR,
  META_FUNNEL,
  MRR_PURCHASED_ITEM,
  UPSELL_PRICE_DOLLARS,
  buildFunnelItems,
  buildLaunchKitItem,
  creditActive,
  creditExpiresIso,
  funnelContentIds,
  funnelTotalDollars,
  checkoutHref,
  isFunnelCancelUrl,
  isFunnelSuccessUrl,
  launchKitHref,
  upsellCheckoutDescription,
} from "@/lib/meta-funnel";
import { resolveProgramInput, withCleanFunnelSearch } from "@/lib/program-codes";
import {
  approximateFunnelDiscount,
  couponRefFromPromo,
  dollarsMetadata,
  funnelDiscountSessionFields,
  FunnelPromoError,
  readFunnelPromo,
} from "@/lib/funnel-promo";
import { packItemsMetadata } from "@/lib/stripe-items";
import { STATE_NAMES } from "@/lib/us-states";

export class FunnelOrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "FunnelOrderError";
    this.status = status;
  }
}

const NOT_REUSABLE = new Set([
  "afterpay_clearpay",
  "klarna",
  "affirm",
  "wechat_pay",
  "alipay",
  "ideal",
  "bancontact",
  "eps",
  "p24",
  "giropay",
  "sofort",
  "multibanco",
  "boleto",
  "oxxo",
  "konbini",
  "customer_balance",
]);

export function parseStateProgram(input: { state?: unknown; program?: unknown; type?: unknown }) {
  const code = String(input.state || "").trim().toUpperCase();
  const program = String(input.program || input.type || "").trim().replace(/\s+/g, " ");
  if (!/^[A-Z]{2}$/.test(code) || !STATE_NAMES[code]) {
    throw new FunnelOrderError("Choose a state.");
  }
  if (program.length < 2 || program.length > 120 || /[\r\n]/.test(program)) {
    throw new FunnelOrderError("Choose a program.");
  }
  return { code, program };
}

export async function resolveFunnelBundle(
  supabase: SupabaseClient,
  code: string,
  program: string,
): Promise<{ bundle: CompleteBundle }> {
  const bundle = await findCompleteBundle(supabase, code, program);
  if (!bundle) throw new FunnelOrderError("That state and program isn't available.");
  const assets = await listBundleAssets(supabase, bundle.product_slug);
  const report = assets.some((asset) => asset.label === MRR_PURCHASED_ITEM);
  if (!report) {
    throw new FunnelOrderError("The market research report for that program isn't available yet.");
  }
  return { bundle };
}

function allowedOrigins(requestOrigin: string): string[] {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return [requestOrigin, site].filter(Boolean);
}

function recoveryParams(): Pick<Stripe.Checkout.SessionCreateParams, "consent_collection" | "after_expiration"> {
  if (process.env.STRIPE_CHECKOUT_RECOVERY !== "1") return {};
  return {
    consent_collection: { promotions: "auto" },
    after_expiration: { recovery: { enabled: true, allow_promotion_codes: false } },
  };
}

async function resolveServerPromo(
  stripe: Stripe,
  requested: string,
  subtotalDollars: number,
): Promise<{ id: string; code: string; percent: number; total: number; zeroDue: boolean }> {
  const list = await stripe.promotionCodes.list({ code: requested, active: true, limit: 1 });
  const promo = list.data.find((item) => item.active && item.code?.toUpperCase() === requested);
  if (!promo) {
    throw new FunnelOrderError("That promotion code isn't active.");
  }
  const couponRef = couponRefFromPromo(promo);
  const couponId = typeof couponRef === "string" ? couponRef : couponRef?.id;
  let percent = 0;
  let total = subtotalDollars;
  let known = false;
  if (couponId && couponRef && typeof couponRef !== "string" && (couponRef.percent_off || couponRef.amount_off)) {
    const approx = approximateFunnelDiscount(subtotalDollars, couponRef);
    percent = approx.percent;
    total = approx.total;
    known = true;
  } else if (couponId) {
    const coupon = await stripe.coupons.retrieve(couponId);
    const approx = approximateFunnelDiscount(subtotalDollars, coupon);
    percent = approx.percent;
    total = approx.total;
    known = true;
  }
  return {
    id: promo.id,
    code: promo.code || requested,
    percent,
    total,
    zeroDue: known && total <= 0,
  };
}

export async function createFrontEndCheckout(
  stripe: Stripe,
  supabase: SupabaseClient,
  input: {
    state?: unknown;
    program?: unknown;
    type?: unknown;
    promotionCode?: unknown;
    promoCode?: unknown;
    promo?: unknown;
    successUrl?: unknown;
    cancelUrl?: unknown;
    p?: unknown;
    userId?: string | null;
    requestOrigin: string;
    meta?: MetaBrowserContext;
  },
): Promise<{ url: string; sessionId: string; amount: number; contentIds: string[] }> {
  const { code, program } = parseStateProgram({
    state: input.state,
    program: resolveProgramInput(input.program, input.type, input.p),
  });
  const { bundle } = await resolveFunnelBundle(supabase, code, program);
  const items = buildFunnelItems(bundle);
  const total = funnelTotalDollars();
  let requestedPromo: string | null;
  try {
    requestedPromo = readFunnelPromo(input);
  } catch (err) {
    if (err instanceof FunnelPromoError) throw new FunnelOrderError(err.message, err.status);
    throw err;
  }
  const applied = requestedPromo ? await resolveServerPromo(stripe, requestedPromo, total) : null;
  const charged = applied ? applied.total : total;
  const origins = allowedOrigins(input.requestOrigin);
  const successUrl =
    typeof input.successUrl === "string" && isFunnelSuccessUrl(input.successUrl, origins)
      ? input.successUrl
      : `${origins[0]}/market-research/upsell?session_id={CHECKOUT_SESSION_ID}`;
  const cancelQuery = new URLSearchParams();
  if (applied?.code) cancelQuery.set("promo", applied.code);
  const cancelUrl = withCleanFunnelSearch(
    typeof input.cancelUrl === "string" && isFunnelCancelUrl(input.cancelUrl, origins)
      ? input.cancelUrl
      : `${origins[0]}${checkoutHref(code, program, cancelQuery.toString())}`,
  );

  const metadata: Record<string, string> = {
    funnel: META_FUNNEL,
    state: bundle.code,
    program: bundle.program,
    state_name: bundle.state,
    content_ids: funnelContentIds().join(","),
    discount_code: applied?.code || "",
    discount_percent: applied ? String(applied.percent) : "0",
    tax_amount: "0",
    subtotal: String(total),
    total: dollarsMetadata(charged),
    customer_info: "{}",
    customer_first_name: "",
    customer_last_name: "",
    ...packItemsMetadata(items),
    ...metaAttributionMetadata(input.meta, [input.requestOrigin]),
  };
  if (input.userId) metadata.user_id = input.userId;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: Math.round(item.price * 100),
      product_data: {
        name: item.name,
        description: "State Market Research Report PDF and how-to-read checklist. Instant download.",
      },
    },
  }));

  const base: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    // No promo param: keep the customer "Add promotion code" box.
    // A server-applied code uses discounts and must omit allow_promotion_codes.
    ...funnelDiscountSessionFields(applied),
    custom_text: { submit: { message: CHECKOUT_AGREEMENT_TEXT } },
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    ...recoveryParams(),
  };

  // A 100% code has no PaymentIntent. payment_intent_data (and setup_future_usage)
  // would force a card and block payment_status no_payment_required.
  const zeroDue = applied?.zeroDue === true;
  const sessionParams = (opts: { saveCard: boolean; paymentIntent: boolean; collectIfRequired: boolean }) => {
    const fields: Stripe.Checkout.SessionCreateParams = { ...base, customer_creation: "always" };
    if (!opts.collectIfRequired) delete fields.payment_method_collection;
    if (opts.paymentIntent) {
      fields.payment_intent_data = {
        ...(opts.saveCard ? { setup_future_usage: "off_session" as const } : {}),
        metadata: { funnel: META_FUNNEL, role: "front" },
      };
    }
    return fields;
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      sessionParams({ saveCard: !zeroDue, paymentIntent: !zeroDue, collectIfRequired: true }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/setup_future_usage|future usage|customer_creation|payment_method_collection|payment_intent_data/i.test(message)) throw err;
    console.warn("Funnel checkout retrying without saved card:", message);
    session = await stripe.checkout.sessions.create(
      sessionParams({
        saveCard: false,
        paymentIntent:
          !zeroDue &&
          !/(unknown parameter: payment_intent_data|cannot (provide|pass|include|set) payment_intent_data)/i.test(message),
        collectIfRequired: !/payment_method_collection/i.test(message),
      }),
    );
  }

  if (!session.url) throw new FunnelOrderError("Checkout could not start.", 500);
  const amount = applied ? charged : total;
  await reportInitiateCheckout({
    eventId: session.id,
    value: amount,
    currency: "usd",
    contentIds: funnelContentIds(),
    contentName: "State Market Research Report",
    sourceUrl: input.meta?.sourceUrl || `${input.requestOrigin}/market-research/checkout`,
    fbp: input.meta?.fbp,
    fbc: input.meta?.fbc,
    fbclid: input.meta?.fbclid,
    clientIp: input.meta?.clientIp,
    userAgent: input.meta?.userAgent,
  });
  return {
    url: session.url,
    sessionId: session.id,
    amount,
    contentIds: funnelContentIds(),
  };
}

export async function loadPaidFunnelSession(stripe: Stripe, sessionId: string): Promise<Stripe.Checkout.Session> {
  if (!/^cs_(test|live)_/.test(sessionId)) throw new FunnelOrderError("Unknown checkout.");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.funnel !== META_FUNNEL || session.metadata?.upsell === "launch_kit") {
    throw new FunnelOrderError("Unknown checkout.", 404);
  }
  if (session.status !== "complete" || !["paid", "no_payment_required"].includes(session.payment_status)) {
    throw new FunnelOrderError("Payment isn't complete yet.", 402);
  }
  return session;
}

function customerIdOf(session: Stripe.Checkout.Session): string | null {
  if (typeof session.customer === "string") return session.customer;
  return session.customer?.id || null;
}

export async function reusablePaymentMethod(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{ id: string; customerId: string } | null> {
  const customerId = customerIdOf(session);
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!customerId || !piId) return null;
  const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["payment_method"] });
  const method = pi.payment_method;
  if (!method || typeof method === "string") return null;
  if (NOT_REUSABLE.has(method.type)) return null;
  return { id: method.id, customerId };
}

export async function createUpsellCheckout(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  bundle: CompleteBundle,
  requestOrigin: string,
  meta?: MetaBrowserContext,
): Promise<{ url: string; sessionId: string; amount: number }> {
  const price = UPSELL_PRICE_DOLLARS;
  const item = buildLaunchKitItem(bundle, price);
  const email = session.customer_details?.email || session.customer_email || undefined;
  const customerId = customerIdOf(session);
  const origin = allowedOrigins(requestOrigin)[0];
  const metadata: Record<string, string> = {
    funnel: META_FUNNEL,
    upsell: "launch_kit",
    upsell_source_session: session.id,
    state: bundle.code,
    program: bundle.program,
    state_name: bundle.state,
    content_ids: CONTENT_LAUNCH_KIT,
    discount_code: "",
    discount_percent: "0",
    tax_amount: "0",
    subtotal: String(price),
    total: String(price),
    customer_info: "{}",
    customer_first_name: "",
    customer_last_name: "",
    customer_email: email || "",
    ...(session.customer_details?.phone ? { customer_phone: session.customer_details.phone } : {}),
    ...packItemsMetadata([item]),
    ...metaAttributionMetadata(meta, [requestOrigin]),
  };
  if (session.metadata?.user_id) metadata.user_id = session.metadata.user_id;

  const created = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: price * 100,
          product_data: {
            name: item.name,
            description: upsellCheckoutDescription(),
          },
        },
      },
    ],
    custom_text: { submit: { message: CHECKOUT_AGREEMENT_TEXT } },
    metadata,
    success_url: `${origin}/market-research/thank-you?session_id=${session.id}&upsell_session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/market-research/thank-you?session_id=${session.id}`,
    ...(customerId
      ? {
          customer: customerId,
          saved_payment_method_options: {
            allow_redisplay_filters: ["always", "limited", "unspecified"],
          },
        }
      : email
        ? { customer_email: email }
        : {}),
    payment_intent_data: {
      metadata: {
        funnel: META_FUNNEL,
        upsell: "launch_kit",
        upsell_source_session: session.id,
      },
    },
  });
  if (!created.url) throw new FunnelOrderError("Launch Kit checkout could not start.", 500);
  const person = splitPersonName(session.customer_details?.name);
  await reportInitiateCheckout({
    eventId: created.id,
    value: price,
    currency: "usd",
    contentIds: [CONTENT_LAUNCH_KIT],
    contentName: "Care Business Launch Kit",
    email,
    phone: session.customer_details?.phone,
    firstName: person.firstName,
    lastName: person.lastName,
    sourceUrl: meta?.sourceUrl || `${requestOrigin}/market-research/upsell`,
    fbp: meta?.fbp,
    fbc: meta?.fbc,
    fbclid: meta?.fbclid,
    clientIp: meta?.clientIp,
    userAgent: meta?.userAgent,
  });
  return { url: created.url, sessionId: created.id, amount: price };
}

export function funnelOrderSummary(session: Stripe.Checkout.Session, upsellTaken: boolean) {
  const created = session.created || Math.floor(Date.now() / 1000);
  const purchasedAt = created * 1000;
  const active = creditActive(purchasedAt);
  const contentIds = String(session.metadata?.content_ids || CONTENT_MRR)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return {
    paid: true,
    amount: typeof session.amount_total === "number" ? Math.round(session.amount_total) / 100 : 0,
    currency: "USD",
    contentIds: contentIds.length ? contentIds : [CONTENT_MRR],
    stateCode: session.metadata?.state || "",
    stateName: session.metadata?.state_name || session.metadata?.state || "",
    program: session.metadata?.program || "",
    email: session.customer_details?.email || session.customer_email || null,
    creditExpiresAt: creditExpiresIso(created),
    creditActive: active && !upsellTaken,
    upsellPrice: active ? UPSELL_PRICE_DOLLARS : null,
    upsellTaken,
    launchKitUrl: launchKitHref(session.metadata?.state || "", session.metadata?.program || ""),
  };
}

export async function rememberSessionMetadata(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  patch: Record<string, string>,
) {
  try {
    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...(session.metadata || {}), ...patch },
    });
  } catch (err) {
    console.error("Could not store upsell id on the checkout session:", err);
  }
}

export async function queueFrontPurchaseEmail(session: Stripe.Checkout.Session) {
  try {
    const result = await queueFunnelEmail("meta_mrr_purchased", {
      email: session.customer_details?.email || session.customer_email,
      name: session.customer_details?.name,
      sessionId: session.id,
      state: session.metadata?.state,
      stateName: session.metadata?.state_name,
      program: session.metadata?.program,
      creditExpiresAt: creditExpiresIso(session.created || Math.floor(Date.now() / 1000)),
      amount: session.amount_total != null ? session.amount_total / 100 : null,
    });
    console.log("Market research receipt:", result.reason, session.id);
    return result;
  } catch (err) {
    console.error("Market research receipt failed:", err instanceof Error ? err.message : "error");
    return { queued: false as const, reason: "resend-network" as const };
  }
}

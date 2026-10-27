import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { listBundleAssets } from "@/lib/bundle-files";
import { findCompleteBundle, type CompleteBundle } from "@/lib/complete-bundles";
import { queueFunnelEmail } from "@/lib/funnel-email";
import { CHECKOUT_AGREEMENT_TEXT } from "@/lib/legal";
import {
  CONTENT_LAUNCH_KIT,
  CONTENT_MRR,
  META_FUNNEL,
  MRR_PRICE_DOLLARS,
  MRR_PURCHASED_ITEM,
  UPSELL_PRICE_DOLLARS,
  buildFunnelItems,
  buildLaunchKitItem,
  creditActive,
  creditExpiresIso,
  funnelContentIds,
  funnelTotalDollars,
  isFunnelCancelUrl,
  isFunnelSuccessUrl,
  launchKitHref,
  upsellCheckoutDescription,
} from "@/lib/meta-funnel";
import { packItemsMetadata } from "@/lib/stripe-items";
import { STATE_NAMES } from "@/lib/us-states";

export class FunnelOrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
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

export async function createFrontEndCheckout(
  stripe: Stripe,
  supabase: SupabaseClient,
  input: {
    state?: unknown;
    program?: unknown;
    type?: unknown;
    successUrl?: unknown;
    cancelUrl?: unknown;
    userId?: string | null;
    requestOrigin: string;
  },
): Promise<{ url: string; sessionId: string; amount: number; contentIds: string[] }> {
  const { code, program } = parseStateProgram(input);
  const { bundle } = await resolveFunnelBundle(supabase, code, program);
  const items = buildFunnelItems(bundle);
  const total = funnelTotalDollars();
  const origins = allowedOrigins(input.requestOrigin);
  const successUrl =
    typeof input.successUrl === "string" && isFunnelSuccessUrl(input.successUrl, origins)
      ? input.successUrl
      : `${origins[0]}/market-research/upsell?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    typeof input.cancelUrl === "string" && isFunnelCancelUrl(input.cancelUrl, origins)
      ? input.cancelUrl
      : `${origins[0]}/market-research/checkout?state=${code}&type=${encodeURIComponent(program)}`;

  const metadata: Record<string, string> = {
    funnel: META_FUNNEL,
    state: bundle.code,
    program: bundle.program,
    state_name: bundle.state,
    content_ids: funnelContentIds().join(","),
    discount_code: "",
    discount_percent: "0",
    tax_amount: "0",
    subtotal: String(total),
    total: String(total),
    customer_info: "{}",
    customer_first_name: "",
    customer_last_name: "",
    ...packItemsMetadata(items),
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
    // Promo box for codes such as CLSFREE1 (coupon CLS_SCREENSHOT_ONCE).
    // Shop checkout leaves this off; this $47 session is the one that needs it.
    allow_promotion_codes: true,
    custom_text: { submit: { message: CHECKOUT_AGREEMENT_TEXT } },
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    ...recoveryParams(),
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      ...base,
      customer_creation: "always",
      payment_intent_data: {
        setup_future_usage: "off_session",
        metadata: { funnel: META_FUNNEL, role: "front" },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/setup_future_usage|future usage|customer_creation/i.test(message)) throw err;
    console.warn("Funnel checkout retrying without saved card:", message);
    session = await stripe.checkout.sessions.create({
      ...base,
      payment_intent_data: { metadata: { funnel: META_FUNNEL, role: "front" } },
    });
  }

  if (!session.url) throw new FunnelOrderError("Checkout could not start.", 500);
  return { url: session.url, sessionId: session.id, amount: total, contentIds: funnelContentIds() };
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
): Promise<string> {
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
    ...packItemsMetadata([item]),
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
  return created.url;
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
    amount: (session.amount_total ?? MRR_PRICE_DOLLARS * 100) / 100,
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
  await queueFunnelEmail("meta_mrr_purchased", {
    email: session.customer_details?.email || session.customer_email,
    name: session.customer_details?.name,
    sessionId: session.id,
    state: session.metadata?.state,
    program: session.metadata?.program,
    creditExpiresAt: creditExpiresIso(session.created || Math.floor(Date.now() / 1000)),
    amount: session.amount_total != null ? session.amount_total / 100 : null,
  });
}

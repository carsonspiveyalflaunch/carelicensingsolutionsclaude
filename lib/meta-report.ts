import type Stripe from "stripe";
import {
  META_CAPI_SENT,
  attributionFromMetadata,
  metaCapiTestEventCode,
  sendMetaCapiInitiateCheckout,
  sendMetaCapiPurchase,
  splitPersonName,
  type MetaEventInput,
} from "@/lib/meta-capi";
import { CONTENT_LAUNCH_KIT, CONTENT_MRR, META_FUNNEL } from "@/lib/meta-funnel";
import { SITE_URL } from "@/lib/seo";

/**
 * Stripe paid completion → Meta Purchase.
 * Hosted checkout (the $47 report and the hosted $647 kit) uses the Checkout
 * Session id. The one-click kit uses the PaymentIntent id. A Checkout-created
 * kit PaymentIntent is not sent here; checkout.session.completed sends it, so
 * the upsell is one Purchase rather than two.
 */

export type CheckoutLike = {
  id: string;
  created?: number | null;
  currency?: string | null;
  amount_total?: number | null;
  payment_status?: string | null;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
  } | null;
  metadata?: Record<string, string> | null;
};

export type PaymentIntentLike = {
  id: string;
  created?: number | null;
  currency?: string | null;
  amount?: number | null;
  amount_received?: number | null;
  status?: string | null;
  metadata?: Record<string, string> | null;
};

export function dollarsFromCents(cents: number | null | undefined): number | null {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  return Math.round(cents) / 100;
}

/** One-click kit charges carry the buyer email and line items. Hosted-checkout PaymentIntents do not. */
export function isOneClickLaunchKitPi(metadata: Record<string, string> | null | undefined): boolean {
  if (!metadata) return false;
  if (metadata.funnel !== META_FUNNEL || metadata.upsell !== "launch_kit") return false;
  return Boolean((metadata.customer_email || "").trim() || (metadata.items || "").trim());
}

function contentFromCheckout(metadata: Record<string, string> | null | undefined): {
  contentIds: string[];
  contentName: string;
  sourceUrl: string;
} {
  const kit = metadata?.upsell === "launch_kit";
  const parsed = String(metadata?.content_ids || (kit ? CONTENT_LAUNCH_KIT : CONTENT_MRR))
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return {
    contentIds: parsed.length ? parsed : [kit ? CONTENT_LAUNCH_KIT : CONTENT_MRR],
    contentName: kit ? "Care Business Launch Kit" : "State Market Research Report",
    sourceUrl: `${SITE_URL}${kit ? "/market-research/thank-you" : "/market-research/upsell"}`,
  };
}

/** Actual amount paid. Unpaid and 100%-off sessions are value 0 so they are not real Purchases. */
export function checkoutPurchaseInput(session: CheckoutLike): MetaEventInput | null {
  if (session.metadata?.funnel !== META_FUNNEL) return null;
  const content = contentFromCheckout(session.metadata);
  const person = splitPersonName(session.customer_details?.name);
  const browser = attributionFromMetadata(session.metadata);
  const paid = session.payment_status === "paid";
  const value = paid ? dollarsFromCents(session.amount_total) ?? 0 : 0;
  return {
    eventId: session.id,
    eventTime: session.created || undefined,
    value,
    currency: session.currency || "usd",
    contentIds: content.contentIds,
    contentName: content.contentName,
    email: session.customer_details?.email || session.customer_email || session.metadata?.customer_email || null,
    phone: session.customer_details?.phone || session.metadata?.customer_phone || null,
    firstName: session.metadata?.customer_first_name || person.firstName,
    lastName: session.metadata?.customer_last_name || person.lastName,
    sourceUrl: content.sourceUrl,
    fbp: browser.fbp,
    fbc: browser.fbc,
    clientIp: browser.clientIp,
    userAgent: browser.userAgent,
  };
}

export function paymentIntentPurchaseInput(pi: PaymentIntentLike): MetaEventInput | null {
  if (!isOneClickLaunchKitPi(pi.metadata) || pi.status !== "succeeded") return null;
  const received = dollarsFromCents(pi.amount_received);
  const amount = dollarsFromCents(pi.amount);
  const value = received && received > 0 ? received : amount && amount > 0 ? amount : 0;
  const person = splitPersonName(pi.metadata?.customer_name);
  const browser = attributionFromMetadata(pi.metadata);
  return {
    eventId: pi.id,
    eventTime: pi.created || undefined,
    value,
    currency: pi.currency || "usd",
    contentIds: [CONTENT_LAUNCH_KIT],
    contentName: "Care Business Launch Kit",
    email: pi.metadata?.customer_email || null,
    phone: pi.metadata?.customer_phone || null,
    firstName: person.firstName,
    lastName: person.lastName,
    sourceUrl: `${SITE_URL}/market-research/thank-you`,
    fbp: browser.fbp,
    fbc: browser.fbc,
    clientIp: browser.clientIp,
    userAgent: browser.userAgent,
  };
}

async function markReported(
  update: (id: string, metadata: Record<string, string>) => Promise<unknown>,
  id: string,
) {
  try {
    await update(id, { [META_CAPI_SENT]: "1" });
  } catch (err) {
    console.error("Meta CAPI flag update failed:", err instanceof Error ? err.message : "error");
  }
}

export async function reportCheckoutPurchase(
  stripe: Stripe,
  session: CheckoutLike,
): Promise<{ sent: boolean; reason: string }> {
  if (session.metadata?.[META_CAPI_SENT] === "1") return { sent: false, reason: "already-sent" };
  const input = checkoutPurchaseInput(session);
  if (!input) return { sent: false, reason: "not-funnel" };
  // Unpaid is not a completed free checkout. Don't emit a test Purchase that
  // would dedupe away a later paid Purchase with the same Checkout Session id.
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { sent: false, reason: "unpaid" };
  }
  if (!(input.value > 0) && !metaCapiTestEventCode()) return { sent: false, reason: "unpaid" };
  const result = await sendMetaCapiPurchase(input);
  console.log("Meta CAPI purchase:", result.reason, input.eventId);
  if (result.sent) {
    await markReported(
      (id, metadata) => stripe.checkout.sessions.update(id, { metadata }),
      session.id,
    );
  }
  return result;
}

export async function reportPaymentIntentPurchase(
  stripe: Stripe | null,
  pi: PaymentIntentLike,
): Promise<{ sent: boolean; reason: string }> {
  if (pi.metadata?.[META_CAPI_SENT] === "1") return { sent: false, reason: "already-sent" };
  if (pi.metadata?.funnel === META_FUNNEL && pi.metadata?.upsell === "launch_kit" && !isOneClickLaunchKitPi(pi.metadata)) {
    return { sent: false, reason: "checkout-session" };
  }
  const input = paymentIntentPurchaseInput(pi);
  if (!input) return { sent: false, reason: "not-funnel" };
  if (!(input.value > 0)) return { sent: false, reason: "unpaid" };
  const result = await sendMetaCapiPurchase(input);
  console.log("Meta CAPI launch kit:", result.reason, input.eventId);
  if (result.sent && stripe) {
    await markReported(
      (id, metadata) => stripe.paymentIntents.update(id, { metadata }),
      pi.id,
    );
  }
  return result;
}

export async function reportInitiateCheckout(input: MetaEventInput): Promise<{ sent: boolean; reason: string }> {
  try {
    const result = await sendMetaCapiInitiateCheckout(input);
    console.log("Meta CAPI InitiateCheckout:", result.reason, input.eventId);
    return result;
  } catch (err) {
    console.error("Meta CAPI InitiateCheckout failed:", err instanceof Error ? err.message : "error");
    return { sent: false, reason: "error" };
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { findCompleteBundle } from "@/lib/complete-bundles";
import { queueFunnelEmail } from "@/lib/funnel-email";
import { syncFunnelBuyerInGhl } from "@/lib/ghl-funnel";
import { sendMetaCapiPurchase, splitPersonName } from "@/lib/meta-capi";
import { CONTENT_LAUNCH_KIT, META_FUNNEL, UPSELL_PRICE_DOLLARS, buildLaunchKitItem, creditExpiresIso } from "@/lib/meta-funnel";
import { STATE_NAMES } from "@/lib/us-states";
import { deliverAccess, grantPurchase } from "@/lib/purchase-access";
import { sendLaunchKitSkoolInvite } from "@/lib/skool-invite";
import { readItemsMetadata } from "@/lib/stripe-items";

const UPSELL_CENTS = UPSELL_PRICE_DOLLARS * 100;

export async function findCompletedUpsell(supabase: SupabaseClient, sourceSessionId: string) {
  const { data, error } = await supabase
    .from("purchases")
    .select("id, status, amount, stripe_payment_intent_id, stripe_session_id")
    .eq("status", "completed")
    .eq("metadata->>upsell_source_session", sourceSessionId)
    .limit(1);
  if (error) {
    console.error("findCompletedUpsell failed:", error);
    return null;
  }
  return data?.[0] || null;
}

/** event_id Meta should dedupe: PaymentIntent id for one-click, Checkout Session id for hosted kit checkout. */
export function upsellPurchaseEventId(
  row: { stripe_session_id?: string | null; stripe_payment_intent_id?: string | null } | null | undefined,
): string {
  if (!row) return "";
  const sessionId = row.stripe_session_id || "";
  const pi = row.stripe_payment_intent_id || "";
  if (sessionId.startsWith("pi_") && /^pi_/.test(pi)) return pi;
  if (/^cs_(test|live)_/.test(sessionId)) return sessionId;
  if (/^pi_/.test(pi)) return pi;
  return "";
}

async function bundleFromMetadata(supabase: SupabaseClient, metadata: Stripe.Metadata | null) {
  const code = metadata?.state || "";
  const program = metadata?.program || "";
  if (!code || !program) return null;
  return findCompleteBundle(supabase, code, program);
}

/**
 * Record a succeeded one-click Launch Kit PaymentIntent.
 * Checkout-session upsells are recorded by the existing checkout.session.completed handler.
 */
export async function fulfillLaunchKitPaymentIntent(supabase: SupabaseClient, pi: Stripe.PaymentIntent) {
  if (pi.metadata?.funnel !== META_FUNNEL || pi.metadata?.upsell !== "launch_kit") return null;
  if (pi.status !== "succeeded") return null;
  if (pi.amount !== UPSELL_CENTS) {
    console.error("Refusing Launch Kit PaymentIntent with unexpected amount", pi.id, pi.amount);
    return null;
  }

  const sessionKey = `pi_${pi.id}`;
  const items = readItemsMetadata(pi.metadata);
  const kitItems = items.length
    ? items
    : await (async () => {
        const bundle = await bundleFromMetadata(supabase, pi.metadata);
        return bundle ? [buildLaunchKitItem(bundle, UPSELL_PRICE_DOLLARS)] : [];
      })();
  if (!kitItems.length) {
    // Fallback Checkout puts the kit line items on the Checkout Session.
    // Its PaymentIntent only carries funnel, upsell, and the source session,
    // so there is nothing to fulfill here. checkout.session.completed sends
    // the Skool invite for that purchase. Returning avoids a second purchase.
    if (pi.metadata?.state || pi.metadata?.program) {
      console.error("Launch Kit PaymentIntent has no deliverable item", pi.id);
    }
    return null;
  }

  const email = (pi.metadata.customer_email || pi.receipt_email || "").trim().toLowerCase();
  const name = pi.metadata.customer_name || "";
  const { data: existingRows } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_session_id", sessionKey)
    .limit(1);
  const alreadyRecorded = Boolean(existingRows?.[0]);

  const purchaseData: Record<string, unknown> = {
    stripe_session_id: sessionKey,
    stripe_payment_intent_id: pi.id,
    amount: pi.amount_received ? pi.amount_received / 100 : pi.amount / 100,
    discount_code: "",
    discount_amount: 0,
    tax_amount: 0,
    status: "completed",
    metadata: {
      customer_email: email,
      customer_name: name,
      customer_info: {},
      items: kitItems,
      funnel: META_FUNNEL,
      upsell: "launch_kit",
      upsell_source_session: pi.metadata.upsell_source_session || "",
    },
  };
  if (pi.metadata.user_id) purchaseData.user_id = pi.metadata.user_id;

  const { data: purchase, error } = await supabase
    .from("purchases")
    .upsert(purchaseData, { onConflict: "stripe_session_id" })
    .select()
    .single();
  if (error || !purchase) {
    console.error("Launch Kit upsell purchase upsert failed:", error);
    return null;
  }

  if (pi.metadata.user_id) {
    await grantPurchase(supabase, pi.metadata.user_id, purchase);
  }

  if (!alreadyRecorded && email) {
    try {
      await deliverAccess(supabase, email, name);
    } catch (deliveryError) {
      console.error("Launch Kit access email failed:", deliveryError);
    }
    const sourceCreated = Number(pi.metadata.source_created || "0");
    await queueFunnelEmail("meta_mrr_launch_kit_accepted", {
      email,
      name,
      sessionId: pi.metadata.upsell_source_session,
      state: pi.metadata.state,
      program: pi.metadata.program,
      amount: UPSELL_PRICE_DOLLARS,
      creditExpiresAt: sourceCreated ? creditExpiresIso(sourceCreated) : null,
    });
  }

  if (email) {
    const ghl = await syncFunnelBuyerInGhl({
      email,
      name,
      state: pi.metadata.state,
      stateName: pi.metadata.state_name || STATE_NAMES[pi.metadata.state || ""] || "",
      program: pi.metadata.program,
      launchKit: true,
      extraTags: ["cls-purchased", "cls-bought-bundle"],
    });
    console.log("GHL launch kit buyer:", ghl.reason);
  }

  // Same academy invite the Checkout bundle path sends. The lock is the
  // PaymentIntent id, so this call and a later payment_intent.succeeded
  // replay (or the Checkout handler, if it already sent) do not double-post.
  if (purchase?.id) {
    await sendLaunchKitSkoolInvite(supabase, {
      items: kitItems,
      email,
      customerName: name,
      paymentIntentId: pi.id,
      purchaseId: purchase.id,
    });
  }

  const person = splitPersonName(name);
  try {
    const capi = await sendMetaCapiPurchase({
      eventId: pi.id,
      eventTime: pi.created,
      value: pi.amount_received ? pi.amount_received / 100 : pi.amount / 100,
      currency: pi.currency || "usd",
      contentIds: [CONTENT_LAUNCH_KIT],
      contentName: "Care Business Launch Kit",
      email,
      phone: pi.metadata.customer_phone || null,
      firstName: person.firstName,
      lastName: person.lastName,
    });
    console.log("Meta CAPI launch kit:", capi.reason, pi.id);
  } catch (capiError) {
    console.error("Meta CAPI launch kit failed:", capiError instanceof Error ? capiError.message : "error");
  }

  return purchase;
}

/** True when the $647 kit was paid, and records a one-click PaymentIntent if Stripe already captured it. */
export async function isUpsellComplete(
  stripe: Stripe,
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  hints: { upsellSession?: string | null; upsellPi?: string | null },
): Promise<boolean> {
  const row = await findCompletedUpsell(supabase, session.id);
  if (row) return true;

  const piId = hints.upsellPi || session.metadata?.upsell_payment_intent || "";
  if (/^pi_/.test(piId)) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId);
      if (
        pi.status === "succeeded" &&
        pi.metadata?.funnel === META_FUNNEL &&
        pi.metadata?.upsell === "launch_kit" &&
        pi.metadata?.upsell_source_session === session.id
      ) {
        await fulfillLaunchKitPaymentIntent(supabase, pi);
        return true;
      }
    } catch (err) {
      console.error("Upsell PaymentIntent lookup failed:", err);
    }
  }

  const upsellSessionId = hints.upsellSession || "";
  if (/^cs_(test|live)_/.test(upsellSessionId)) {
    try {
      const upsell = await stripe.checkout.sessions.retrieve(upsellSessionId);
      if (
        upsell.status === "complete" &&
        ["paid", "no_payment_required"].includes(upsell.payment_status) &&
        upsell.metadata?.upsell === "launch_kit" &&
        upsell.metadata?.upsell_source_session === session.id
      ) {
        return true;
      }
    } catch (err) {
      console.error("Upsell Checkout Session lookup failed:", err);
    }
  }

  return false;
}

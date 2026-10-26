import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { findCompleteBundle } from "@/lib/complete-bundles";
import { queueFunnelEmail } from "@/lib/funnel-email";
import { META_FUNNEL, UPSELL_PRICE_DOLLARS, buildLaunchKitItem, creditExpiresIso } from "@/lib/meta-funnel";
import { deliverAccess, grantPurchase } from "@/lib/purchase-access";
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
    console.error("Launch Kit PaymentIntent has no deliverable item", pi.id);
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

  return purchase;
}

/** True when the $950 kit was paid, and records a one-click PaymentIntent if Stripe already captured it. */
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

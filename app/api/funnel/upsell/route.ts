import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { findCompleteBundle } from "@/lib/complete-bundles";
import {
  createUpsellCheckout,
  FunnelOrderError,
  loadPaidFunnelSession,
  rememberSessionMetadata,
  reusablePaymentMethod,
} from "@/lib/funnel-checkout";
import { fulfillLaunchKitPaymentIntent, isUpsellComplete } from "@/lib/funnel-fulfill";
import {
  META_FUNNEL,
  UPSELL_PRICE_DOLLARS,
  buildLaunchKitItem,
  creditActive,
  launchKitHref,
  thankYouHref,
} from "@/lib/meta-funnel";
import { packItemsMetadata } from "@/lib/stripe-items";
import { getStripe } from "@/lib/stripe-server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

function jsonError(err: unknown) {
  if (err instanceof FunnelOrderError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("Launch Kit upsell failed:", err);
  return NextResponse.json({ error: "The Launch Kit could not be added." }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const supabase = createServerSupabaseClient();
    const session = await loadPaidFunnelSession(stripe, sessionId);

    if (typeof body.paymentIntentId === "string" && body.paymentIntentId) {
      return completeConfirmedPayment(stripe, supabase, session, body.paymentIntentId);
    }

    if (await isUpsellComplete(stripe, supabase, session, {})) {
      return NextResponse.json({ alreadyOwned: true, redirect: thankYouHref(session.id) });
    }

    const purchasedAt = (session.created || 0) * 1000;
    if (!creditActive(purchasedAt)) {
      return NextResponse.json({
        expired: true,
        launchKitUrl: launchKitHref(session.metadata?.state || "", session.metadata?.program || ""),
      });
    }

    const bundle = await findCompleteBundle(supabase, session.metadata?.state || "", session.metadata?.program || "");
    if (!bundle) throw new FunnelOrderError("That Launch Kit isn't available.", 404);

    const saved = await reusablePaymentMethod(stripe, session);
    if (!saved) {
      const url = await createUpsellCheckout(stripe, session, bundle, request.nextUrl.origin);
      return NextResponse.json({ fallback: true, url });
    }

    const attempt = Number(session.metadata?.upsell_attempt || "1") || 1;
    const existingId = session.metadata?.upsell_payment_intent || "";
    if (/^pi_/.test(existingId)) {
      const existing = await stripe.paymentIntents.retrieve(existingId);
      if (existing.status === "succeeded") {
        await fulfillLaunchKitPaymentIntent(supabase, existing);
        return NextResponse.json({ ok: true, redirect: thankYouHref(session.id, { upsellPi: existing.id }) });
      }
      if (existing.status === "requires_action" && existing.client_secret) {
        return NextResponse.json({ requiresAction: true, clientSecret: existing.client_secret, paymentIntentId: existing.id });
      }
    }

    const email = session.customer_details?.email || session.customer_email || "";
    const name = session.customer_details?.name || "";
    const item = buildLaunchKitItem(bundle, UPSELL_PRICE_DOLLARS);
    const metadata: Record<string, string> = {
      funnel: META_FUNNEL,
      upsell: "launch_kit",
      upsell_source_session: session.id,
      state: bundle.code,
      program: bundle.program,
      customer_email: email,
      customer_name: name,
      source_created: String(session.created || ""),
      ...packItemsMetadata([item]),
    };
    if (session.metadata?.user_id) metadata.user_id = session.metadata.user_id;

    try {
      const pi = await stripe.paymentIntents.create(
        {
          amount: UPSELL_PRICE_DOLLARS * 100,
          currency: "usd",
          customer: saved.customerId,
          payment_method: saved.id,
          off_session: true,
          confirm: true,
          description: `${bundle.state} ${bundle.program} Care Business Launch Kit`,
          receipt_email: email || undefined,
          metadata,
        },
        { idempotencyKey: `meta-mrr-lk-${session.id}-${attempt}` },
      );
      await rememberSessionMetadata(stripe, session, { upsell_payment_intent: pi.id, upsell_attempt: String(attempt) });
      if (pi.status === "succeeded") {
        await fulfillLaunchKitPaymentIntent(supabase, pi);
        return NextResponse.json({ ok: true, redirect: thankYouHref(session.id, { upsellPi: pi.id }) });
      }
      if (pi.status === "requires_action" && pi.client_secret) {
        return NextResponse.json({ requiresAction: true, clientSecret: pi.client_secret, paymentIntentId: pi.id });
      }
    } catch (err) {
      const authPi = authenticationIntent(err);
      if (authPi?.client_secret) {
        await rememberSessionMetadata(stripe, session, {
          upsell_payment_intent: authPi.id,
          upsell_attempt: String(attempt),
        });
        return NextResponse.json({
          requiresAction: true,
          clientSecret: authPi.client_secret,
          paymentIntentId: authPi.id,
        });
      }
      console.error("One-click Launch Kit charge failed; opening Checkout:", err);
      await rememberSessionMetadata(stripe, session, { upsell_attempt: String(attempt + 1) });
    }

    const url = await createUpsellCheckout(stripe, session, bundle, request.nextUrl.origin);
    return NextResponse.json({ fallback: true, url });
  } catch (err) {
    return jsonError(err);
  }
}

async function completeConfirmedPayment(
  stripe: Stripe,
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  paymentIntentId: string,
) {
  if (!/^pi_/.test(paymentIntentId)) throw new FunnelOrderError("Unknown payment.");
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.metadata?.upsell_source_session !== session.id || pi.metadata?.upsell !== "launch_kit") {
    throw new FunnelOrderError("Unknown payment.", 404);
  }
  if (pi.status !== "succeeded") {
    return NextResponse.json({ error: "The bank still needs to approve that card." }, { status: 402 });
  }
  await fulfillLaunchKitPaymentIntent(supabase, pi);
  return NextResponse.json({ ok: true, redirect: thankYouHref(session.id, { upsellPi: pi.id }) });
}

function authenticationIntent(err: unknown): Stripe.PaymentIntent | null {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "authentication_required" &&
    "payment_intent" in err
  ) {
    const pi = (err as { payment_intent?: Stripe.PaymentIntent }).payment_intent;
    return pi || null;
  }
  return null;
}

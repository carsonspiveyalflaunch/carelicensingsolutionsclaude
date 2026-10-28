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
import { metaAttributionMetadata, metaContextFromRequest, splitPersonName, type MetaBrowserContext } from "@/lib/meta-capi";
import {
  CONTENT_LAUNCH_KIT,
  META_FUNNEL,
  UPSELL_PRICE_DOLLARS,
  buildLaunchKitItem,
  creditActive,
  launchKitHref,
  thankYouHref,
} from "@/lib/meta-funnel";
import { reportInitiateCheckout } from "@/lib/meta-report";
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
    const meta = metaContextFromRequest(request, body);
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
      const checkout = await createUpsellCheckout(stripe, session, bundle, request.nextUrl.origin, meta);
      return NextResponse.json({
        fallback: true,
        url: checkout.url,
        sessionId: checkout.sessionId,
        amount: checkout.amount,
      });
    }

    const attempt = Number(session.metadata?.upsell_attempt || "1") || 1;
    const existingId = session.metadata?.upsell_payment_intent || "";
    if (/^pi_/.test(existingId)) {
      const existing = await stripe.paymentIntents.retrieve(existingId);
      if (existing.status === "succeeded") {
        await fulfillLaunchKitPaymentIntent(supabase, existing, stripe);
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
      ...(session.customer_details?.phone ? { customer_phone: session.customer_details.phone } : {}),
      source_created: String(session.created || ""),
      ...packItemsMetadata([item]),
      ...metaAttributionMetadata(meta, [request.nextUrl.origin]),
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
      await reportUpsellCheckoutStart(pi.id, meta, request.nextUrl.origin, {
        email,
        phone: session.customer_details?.phone,
        name,
      });
      if (pi.status === "succeeded") {
        await fulfillLaunchKitPaymentIntent(supabase, pi, stripe);
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
        await reportUpsellCheckoutStart(authPi.id, meta, request.nextUrl.origin, {
          email,
          phone: session.customer_details?.phone,
          name,
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

    const checkout = await createUpsellCheckout(stripe, session, bundle, request.nextUrl.origin, meta);
    return NextResponse.json({
      fallback: true,
      url: checkout.url,
      sessionId: checkout.sessionId,
      amount: checkout.amount,
    });
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
  await fulfillLaunchKitPaymentIntent(supabase, pi, stripe);
  return NextResponse.json({ ok: true, redirect: thankYouHref(session.id, { upsellPi: pi.id }) });
}

function reportUpsellCheckoutStart(
  eventId: string,
  meta: MetaBrowserContext,
  origin: string,
  buyer: { email?: string | null; phone?: string | null; name?: string | null },
) {
  const person = splitPersonName(buyer.name);
  return reportInitiateCheckout({
    eventId,
    value: UPSELL_PRICE_DOLLARS,
    currency: "usd",
    contentIds: [CONTENT_LAUNCH_KIT],
    contentName: "Care Business Launch Kit",
    email: buyer.email,
    phone: buyer.phone,
    firstName: person.firstName,
    lastName: person.lastName,
    sourceUrl: meta.sourceUrl || `${origin}/market-research/upsell`,
    fbp: meta.fbp,
    fbc: meta.fbc,
    fbclid: meta.fbclid,
    clientIp: meta.clientIp,
    userAgent: meta.userAgent,
  });
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

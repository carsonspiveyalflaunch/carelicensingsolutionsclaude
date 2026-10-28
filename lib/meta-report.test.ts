import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type Stripe from "stripe";
import { buildMetaPurchaseBody } from "./meta-capi.ts";
import { CONTENT_LAUNCH_KIT, CONTENT_MRR } from "./meta-funnel.ts";
import {
  checkoutPurchaseInput,
  isOneClickLaunchKitPi,
  paymentIntentPurchaseInput,
  reportCheckoutPurchase,
  reportPaymentIntentPurchase,
} from "./meta-report.ts";

const ENV_KEYS = ["META_CAPI_ACCESS_TOKEN", "NEXT_PUBLIC_META_PIXEL_ID", "META_PIXEL_ID", "META_CAPI_TEST_EVENT_CODE"] as const;
const saved: Record<string, string | undefined> = {};

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function rememberEnv() {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
}

function fakeStripe() {
  const updates: Array<{ kind: string; id: string; metadata: Record<string, string> }> = [];
  const stripe = {
    checkout: {
      sessions: {
        async update(id: string, params: { metadata: Record<string, string> }) {
          updates.push({ kind: "session", id, metadata: params.metadata });
          return {};
        },
      },
    },
    paymentIntents: {
      async update(id: string, params: { metadata: Record<string, string> }) {
        updates.push({ kind: "pi", id, metadata: params.metadata });
        return {};
      },
    },
  };
  return { stripe: stripe as unknown as Stripe, updates };
}

describe("funnel purchase drafts", () => {
  it("reports the paid $47 report and the paid $647 kit as separate purchases", () => {
    const front = checkoutPurchaseInput({
      id: "cs_live_front",
      created: 1_700_000_000,
      currency: "usd",
      amount_total: 4700,
      payment_status: "paid",
      customer_details: { email: "Mary@Example.com", name: "Mary Ann", phone: "6505551212" },
      metadata: {
        funnel: "meta_mrr",
        content_ids: CONTENT_MRR,
        meta_fbp: "fb.1.1700000000000.123456",
        meta_ip: "203.0.113.8",
        meta_ua: "Mozilla/5.0 Test Browser",
      },
    });
    const kit = checkoutPurchaseInput({
      id: "cs_live_kit",
      created: 1_700_000_100,
      currency: "usd",
      amount_total: 64700,
      payment_status: "paid",
      customer_details: { email: "mary@example.com", name: "Mary Ann" },
      metadata: {
        funnel: "meta_mrr",
        upsell: "launch_kit",
        content_ids: CONTENT_LAUNCH_KIT,
      },
    });
    assert.ok(front);
    assert.ok(kit);
    assert.equal(front.value, 47);
    assert.deepEqual(front.contentIds, ["mrr_47"]);
    assert.equal(front.eventId, "cs_live_front");
    assert.equal(front.contentName, "State Market Research Report");
    assert.equal(kit.value, 647);
    assert.deepEqual(kit.contentIds, ["launch_kit_997"]);
    assert.equal(kit.eventId, "cs_live_kit");
    assert.equal(kit.contentName, "Care Business Launch Kit");
    assert.notEqual(front.eventId, kit.eventId);

    const body = buildMetaPurchaseBody(front);
    assert.ok(body);
    const event = body.data[0] as { event_id: string; user_data: { fbp?: string; client_ip_address?: string } };
    assert.equal(event.event_id, "cs_live_front");
    assert.equal(event.user_data.fbp, "fb.1.1700000000000.123456");
    assert.equal(event.user_data.client_ip_address, "203.0.113.8");
    assert.equal(JSON.stringify(body).includes("Mary@Example.com"), false);
  });

  it("does not turn a free or unpaid checkout into a paid Purchase", () => {
    const free = checkoutPurchaseInput({
      id: "cs_live_free",
      amount_total: 0,
      payment_status: "no_payment_required",
      metadata: { funnel: "meta_mrr", content_ids: "mrr_47" },
      customer_details: { email: "mary@example.com" },
    });
    const unpaid = checkoutPurchaseInput({
      id: "cs_live_open",
      amount_total: 4700,
      payment_status: "unpaid",
      metadata: { funnel: "meta_mrr", content_ids: "mrr_47" },
      customer_details: { email: "mary@example.com" },
    });
    assert.equal(free?.value, 0);
    assert.equal(unpaid?.value, 0);
    assert.equal(checkoutPurchaseInput({ id: "cs_other", amount_total: 4700, payment_status: "paid", metadata: {} }), null);
  });

  it("prices a one-click kit from the PaymentIntent and ignores the hosted-checkout PaymentIntent", () => {
    const oneClick = paymentIntentPurchaseInput({
      id: "pi_kit",
      status: "succeeded",
      amount: 64700,
      amount_received: 64700,
      currency: "usd",
      metadata: {
        funnel: "meta_mrr",
        upsell: "launch_kit",
        customer_email: "buyer@example.com",
        customer_name: "Avery Buyer",
        items: "[]",
      },
    });
    assert.equal(oneClick?.value, 647);
    assert.equal(oneClick?.eventId, "pi_kit");
    assert.deepEqual(oneClick?.contentIds, ["launch_kit_997"]);
    assert.equal(isOneClickLaunchKitPi({ funnel: "meta_mrr", upsell: "launch_kit", upsell_source_session: "cs_front" }), false);
    assert.equal(
      paymentIntentPurchaseInput({
        id: "pi_hosted",
        status: "succeeded",
        amount: 64700,
        amount_received: 64700,
        metadata: { funnel: "meta_mrr", upsell: "launch_kit", upsell_source_session: "cs_front" },
      }),
      null,
    );
  });
});

describe("report funnel purchases", () => {
  it("posts a paid checkout once and skips a second delivery", async () => {
    rememberEnv();
    delete process.env.META_CAPI_TEST_EVENT_CODE;
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    process.env.META_PIXEL_ID = "2202480640703362";
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    const { stripe, updates } = fakeStripe();
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const session = {
      id: "cs_live_front",
      amount_total: 4700,
      payment_status: "paid" as const,
      currency: "usd",
      customer_details: { email: "mary@example.com", name: "Mary Ann" },
      metadata: { funnel: "meta_mrr", content_ids: "mrr_47" },
    };
    try {
      const first = await reportCheckoutPurchase(stripe, session);
      const second = await reportCheckoutPurchase(stripe, {
        ...session,
        metadata: { ...session.metadata, meta_capi_purchase: "1" },
      });
      assert.deepEqual(first, { sent: true, reason: "sent" });
      assert.deepEqual(second, { sent: false, reason: "already-sent" });
      assert.equal(calls, 1);
      assert.equal(updates[0]?.metadata.meta_capi_purchase, "1");
      assert.equal(updates[0]?.id, "cs_live_front");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("does not post or flag a 100% off checkout", async () => {
    rememberEnv();
    delete process.env.META_CAPI_TEST_EVENT_CODE;
    process.env.META_PIXEL_ID = "2202480640703362";
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    const { stripe, updates } = fakeStripe();
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    try {
      const result = await reportCheckoutPurchase(stripe, {
        id: "cs_live_free",
        amount_total: 0,
        payment_status: "no_payment_required",
        customer_details: { email: "mary@example.com" },
        metadata: { funnel: "meta_mrr", content_ids: "mrr_47" },
      });
      assert.deepEqual(result, { sent: false, reason: "unpaid" });
      assert.equal(calls, 0);
      assert.equal(updates.length, 0);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("does not post the hosted kit PaymentIntent", async () => {
    rememberEnv();
    process.env.META_PIXEL_ID = "2202480640703362";
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    const { stripe, updates } = fakeStripe();
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    try {
      const hosted = await reportPaymentIntentPurchase(stripe, {
        id: "pi_hosted",
        status: "succeeded",
        amount: 64700,
        amount_received: 64700,
        metadata: { funnel: "meta_mrr", upsell: "launch_kit", upsell_source_session: "cs_live_front" },
      });
      const kit = await reportPaymentIntentPurchase(stripe, {
        id: "pi_kit",
        status: "succeeded",
        amount: 64700,
        amount_received: 64700,
        currency: "usd",
        metadata: {
          funnel: "meta_mrr",
          upsell: "launch_kit",
          customer_email: "buyer@example.com",
          customer_name: "Avery Buyer",
        },
      });
      assert.deepEqual(hosted, { sent: false, reason: "checkout-session" });
      assert.deepEqual(kit, { sent: true, reason: "sent" });
      assert.equal(calls, 1);
      assert.equal(updates[0]?.kind, "pi");
      assert.equal(updates[0]?.id, "pi_kit");
    } finally {
      globalThis.fetch = original;
    }
  });
});

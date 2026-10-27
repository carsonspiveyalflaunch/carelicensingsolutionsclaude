import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { fulfillLaunchKitPaymentIntent } from "./funnel-fulfill.ts";
import { buildFunnelItems, buildLaunchKitItem, META_FUNNEL, UPSELL_PRICE_DOLLARS, type FunnelBundle } from "./meta-funnel.ts";
import { packItemsMetadata } from "./stripe-items.ts";
import {
  BUNDLE_SKOOL_INVITE_EVENT,
  isCompleteBundleLine,
  sendCheckoutBundleSkoolInvite,
  sendLaunchKitSkoolInvite,
} from "./skool-invite.ts";

const BUNDLE: FunnelBundle = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  product_slug: "texas-personal-home-care-complete-bundle",
  name: "Texas Personal Home Care Complete Bundle",
  code: "TX",
  state: "Texas",
  program: "Personal Home Care",
};

const HOOK = "https://hooks.example.test/skool";

type Row = Record<string, unknown>;

function memorySupabase() {
  const tables: Record<string, Row[]> = { purchases: [], webhooks: [] };
  let purchaseSeq = 0;

  function builder(table: string) {
    const filters: Array<(row: Row) => boolean> = [];
    let operation: "select" | "upsert" | "insert" | "update" | "delete" = "select";
    let payload: Row | null = null;

    const matches = () => (tables[table] || []).filter((row) => filters.every((fn) => fn(row)));

    const api: Record<string, unknown> = {
      select() {
        return api;
      },
      eq(column: string, value: unknown) {
        filters.push((row) => row[column] === value);
        return api;
      },
      limit() {
        return api;
      },
      upsert(row: Row) {
        operation = "upsert";
        payload = row;
        return api;
      },
      insert(row: Row) {
        operation = "insert";
        payload = row;
        return api;
      },
      update(row: Row) {
        operation = "update";
        payload = row;
        return api;
      },
      delete() {
        operation = "delete";
        return api;
      },
      single() {
        return finish();
      },
      maybeSingle() {
        return finish();
      },
      then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
        return finish().then(resolve, reject);
      },
    };

    function finish() {
      if (!tables[table]) tables[table] = [];
      if (operation === "insert") {
        const row = { ...(payload || {}) };
        const duplicate = tables[table].some(
          (existing) => existing.stripe_event_id && existing.stripe_event_id === row.stripe_event_id,
        );
        if (duplicate) {
          return Promise.resolve({
            data: null,
            error: { code: "23505", message: "duplicate key value violates unique constraint" },
          });
        }
        tables[table].push(row);
        return Promise.resolve({ data: row, error: null });
      }
      if (operation === "upsert") {
        const row = { ...(payload || {}) };
        const idx = tables[table].findIndex((existing) => existing.stripe_session_id === row.stripe_session_id);
        if (idx >= 0) tables[table][idx] = { ...tables[table][idx], ...row };
        else {
          purchaseSeq += 1;
          tables[table].push({ id: `purchase-${purchaseSeq}`, ...row });
        }
        const saved = tables[table].find((existing) => existing.stripe_session_id === row.stripe_session_id) || null;
        return Promise.resolve({ data: saved, error: null });
      }
      if (operation === "update") {
        const rows = matches();
        for (const row of rows) Object.assign(row, payload);
        return Promise.resolve({ data: rows, error: null });
      }
      if (operation === "delete") {
        const rows = matches();
        tables[table] = tables[table].filter((row) => !rows.includes(row));
        return Promise.resolve({ data: rows, error: null });
      }
      return Promise.resolve({ data: matches(), error: null });
    }

    return api;
  }

  return {
    tables,
    from(table: string) {
      return builder(table);
    },
    auth: {
      admin: {
        async createUser() {
          return { data: { user: null }, error: { message: "already registered" } };
        },
        async generateLink() {
          return { data: { user: null }, error: null };
        },
      },
    },
  };
}

function kitPaymentIntent(id = "pi_one_click"): Stripe.PaymentIntent {
  const kit = buildLaunchKitItem(BUNDLE, UPSELL_PRICE_DOLLARS);
  return {
    id,
    status: "succeeded",
    amount: UPSELL_PRICE_DOLLARS * 100,
    amount_received: UPSELL_PRICE_DOLLARS * 100,
    metadata: {
      funnel: META_FUNNEL,
      upsell: "launch_kit",
      upsell_source_session: "cs_front_1",
      state: BUNDLE.code,
      program: BUNDLE.program,
      customer_email: "Buyer@Example.com",
      customer_name: "Avery Buyer",
      source_created: "0",
      ...packItemsMetadata([kit]),
    },
  } as unknown as Stripe.PaymentIntent;
}

const envKeys = ["SKOOL_INVITE_WEBHOOK_URL", "GHL_API_KEY", "GHL_PRIVATE_TOKEN", "RESEND_API_KEY"] as const;
const previousEnv = new Map<string, string | undefined>();
let restoreFetch: (() => void) | null = null;

function useHook(fetchImpl: typeof fetch) {
  for (const key of envKeys) {
    if (!previousEnv.has(key)) previousEnv.set(key, process.env[key]);
  }
  process.env.SKOOL_INVITE_WEBHOOK_URL = HOOK;
  delete process.env.GHL_API_KEY;
  delete process.env.GHL_PRIVATE_TOKEN;
  delete process.env.RESEND_API_KEY;
  const original = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  restoreFetch = () => {
    globalThis.fetch = original;
  };
}

afterEach(() => {
  restoreFetch?.();
  restoreFetch = null;
  for (const [key, value] of previousEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  previousEnv.clear();
});

describe("complete bundle skool invite", () => {
  it("treats the launch kit line as a bundle and the $47 report as a single file", () => {
    const kit = buildLaunchKitItem(BUNDLE, UPSELL_PRICE_DOLLARS);
    const [report] = buildFunnelItems(BUNDLE);
    assert.equal(isCompleteBundleLine(kit), true);
    assert.equal(isCompleteBundleLine(report), false);
    assert.equal(isCompleteBundleLine({ product_slug: "bundle-custom", name: "Custom" }), true);
    assert.equal(isCompleteBundleLine({ product_slug: "policy-template", name: "Policy" }), false);
  });

  it("sends one invite when checkout and the kit PaymentIntent share a charge", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    useHook(async (_url, init) => {
      bodies.push(JSON.parse(String(init?.body)));
      return new Response("ok", { status: 200 });
    });
    const supabase = memorySupabase();
    const client = supabase as unknown as SupabaseClient;
    const kit = buildLaunchKitItem(BUNDLE, UPSELL_PRICE_DOLLARS);
    await sendCheckoutBundleSkoolInvite(client, {
      items: [kit],
      isCourseEnrollment: false,
      email: "buyer@example.com",
      customerName: "Avery Buyer",
      paymentIntentId: "pi_checkout_kit",
      purchaseId: "purchase-checkout",
    });
    await sendLaunchKitSkoolInvite(client, {
      items: [kit],
      email: "buyer@example.com",
      customerName: "Avery Buyer",
      paymentIntentId: "pi_checkout_kit",
      purchaseId: "purchase-pi",
    });
    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].event, BUNDLE_SKOOL_INVITE_EVENT);
    assert.equal(bodies[0].customer_email, "buyer@example.com");
    assert.equal(bodies[0].customer_name, "Avery Buyer");
    assert.equal(bodies[0].bundles, kit.name);
    assert.equal(bodies[0].purchase_id, "purchase-checkout");
    assert.equal(supabase.tables.webhooks.length, 1);
    assert.equal(supabase.tables.webhooks[0].processed, true);
    assert.equal(supabase.tables.webhooks[0].stripe_event_id, "skool-invite:pi_checkout_kit");
  });

  it("does not invite a course enrollment or a single-file purchase", async () => {
    let calls = 0;
    useHook(async () => {
      calls += 1;
      return new Response("ok", { status: 200 });
    });
    const supabase = memorySupabase() as unknown as SupabaseClient;
    const report = buildFunnelItems(BUNDLE)[0];
    await sendCheckoutBundleSkoolInvite(supabase, {
      items: [report],
      isCourseEnrollment: false,
      email: "buyer@example.com",
      customerName: "Avery Buyer",
      paymentIntentId: "pi_report",
      purchaseId: "purchase-report",
    });
    await sendCheckoutBundleSkoolInvite(supabase, {
      items: [buildLaunchKitItem(BUNDLE, UPSELL_PRICE_DOLLARS)],
      isCourseEnrollment: true,
      email: "buyer@example.com",
      customerName: "Avery Buyer",
      paymentIntentId: "pi_course",
      purchaseId: "purchase-course",
    });
    assert.equal(calls, 0);
  });

  it("releases the lock when the hook fails so the next attempt can send", async () => {
    let attempts = 0;
    useHook(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("zapier down");
      return new Response("ok", { status: 200 });
    });
    const supabase = memorySupabase();
    const client = supabase as unknown as SupabaseClient;
    const kit = buildLaunchKitItem(BUNDLE, UPSELL_PRICE_DOLLARS);
    const input = {
      items: [kit],
      email: "buyer@example.com",
      customerName: "Avery Buyer",
      paymentIntentId: "pi_retry",
      purchaseId: "purchase-retry",
    };
    await sendLaunchKitSkoolInvite(client, input);
    assert.equal(supabase.tables.webhooks.length, 0);
    await sendLaunchKitSkoolInvite(client, input);
    assert.equal(attempts, 2);
    assert.equal(supabase.tables.webhooks.length, 1);
    assert.equal(supabase.tables.webhooks[0].processed, true);
  });
});

describe("one-click launch kit fulfillment", () => {
  it("sends the academy invite once for a succeeded kit PaymentIntent", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    useHook(async (url, init) => {
      if (String(url) === HOOK) bodies.push(JSON.parse(String(init?.body)));
      return new Response("ok", { status: 200 });
    });
    const supabase = memorySupabase();
    const client = supabase as unknown as SupabaseClient;
    const pi = kitPaymentIntent();
    const first = await fulfillLaunchKitPaymentIntent(client, pi);
    const second = await fulfillLaunchKitPaymentIntent(client, pi);
    assert.ok(first?.id);
    assert.equal(second?.id, first?.id);
    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].event, BUNDLE_SKOOL_INVITE_EVENT);
    assert.equal(bodies[0].customer_email, "buyer@example.com");
    assert.equal(bodies[0].customer_name, "Avery Buyer");
    assert.equal(bodies[0].bundles, buildLaunchKitItem(BUNDLE, UPSELL_PRICE_DOLLARS).name);
    assert.equal(bodies[0].purchase_id, first?.id);
  });

  it("does not invite from a checkout-created PaymentIntent that has no kit line", async () => {
    let calls = 0;
    useHook(async () => {
      calls += 1;
      return new Response("ok", { status: 200 });
    });
    const supabase = memorySupabase() as unknown as SupabaseClient;
    const checkoutPi = {
      id: "pi_checkout_kit",
      status: "succeeded",
      amount: UPSELL_PRICE_DOLLARS * 100,
      amount_received: UPSELL_PRICE_DOLLARS * 100,
      metadata: {
        funnel: META_FUNNEL,
        upsell: "launch_kit",
        upsell_source_session: "cs_front_1",
      },
    } as unknown as Stripe.PaymentIntent;
    const purchase = await fulfillLaunchKitPaymentIntent(supabase, checkoutPi);
    assert.equal(purchase, null);
    assert.equal(calls, 0);
  });
});

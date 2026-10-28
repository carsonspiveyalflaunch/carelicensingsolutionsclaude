import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import {
  buildMetaInitiateCheckoutBody,
  buildMetaPurchaseBody,
  hashMeta,
  hashMetaField,
  metaAttributionMetadata,
  normalizeMetaEmail,
  normalizeMetaPhone,
  sanitizeFbp,
  sendMetaCapiInitiateCheckout,
  sendMetaCapiPurchase,
} from "./meta-capi.ts";

const ENV_KEYS = ["META_CAPI_ACCESS_TOKEN", "NEXT_PUBLIC_META_PIXEL_ID", "META_PIXEL_ID", "META_CAPI_TEST_EVENT_CODE"] as const;
const saved: Record<string, string | undefined> = {};

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function rememberEnv() {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
}

describe("Meta CAPI hashing", () => {
  it("hashes email and phone the way Meta specifies", () => {
    const email = hashMetaField(normalizeMetaEmail, " Mary@Example.com ");
    assert.equal(email, sha("mary@example.com"));
    assert.equal(hashMeta("mary@example.com"), email);
    assert.equal(normalizeMetaEmail("not-an-email"), "");

    const phone = hashMetaField(normalizeMetaPhone, "(650) 555-1212");
    assert.equal(phone, sha("16505551212"));
    assert.equal(hashMetaField(normalizeMetaPhone, "+1 650-555-1212"), phone);
    assert.equal(normalizeMetaPhone("555"), "");
  });

  it("builds a Purchase with the session or payment intent id and no raw email", () => {
    const body = buildMetaPurchaseBody({
      eventId: "cs_test_abc",
      eventTime: 1_700_000_000,
      value: 47,
      contentIds: ["mrr_47"],
      contentName: "State Market Research Report",
      email: "Mary@Example.com",
      phone: "6505551212",
      firstName: "Mary",
      lastName: "Ann",
    });
    assert.ok(body);
    const event = body.data[0] as {
      event_id: string;
      event_name: string;
      user_data: { em: string[]; ph: string[] };
      custom_data: { value: number; content_ids: string[] };
    };
    assert.equal(event.event_name, "Purchase");
    assert.equal(event.event_id, "cs_test_abc");
    assert.equal(event.user_data.em[0], sha("mary@example.com"));
    assert.equal(event.user_data.ph[0], sha("16505551212"));
    assert.equal(event.custom_data.value, 47);
    assert.deepEqual(event.custom_data.content_ids, ["mrr_47"]);
    assert.equal(JSON.stringify(body).includes("Mary@Example.com"), false);
    assert.equal(JSON.stringify(body).includes("mary@example.com"), false);
    assert.equal(
      buildMetaPurchaseBody({
        eventId: "pi_123",
        value: 0,
        contentIds: ["launch_kit_997"],
        contentName: "Kit",
        email: "buyer@example.com",
      }),
      null,
    );
  });
});

describe("Meta CAPI send", () => {
  it("no-ops with a warning when the token or pixel id is missing", async () => {
    rememberEnv();
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    delete process.env.META_PIXEL_ID;
    const warnings: unknown[][] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };
    try {
      const result = await sendMetaCapiPurchase({
        eventId: "cs_test_abc",
        value: 47,
        contentIds: ["mrr_47"],
        contentName: "State Market Research Report",
        email: "mary@example.com",
      });
      assert.deepEqual(result, { sent: false, reason: "missing-env" });
      assert.match(String(warnings[0]?.[0]), /META_CAPI_ACCESS_TOKEN/);
    } finally {
      console.warn = original;
    }
  });

  it("posts the purchase using META_PIXEL_ID when the public pixel id is unset", async () => {
    rememberEnv();
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    process.env.META_PIXEL_ID = "1234567890123";
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    let calledUrl = "";
    let calledBody = "";
    const result = await sendMetaCapiPurchase(
      {
        eventId: "pi_kit",
        eventTime: 1_700_000_100,
        value: 647,
        contentIds: ["launch_kit_997"],
        contentName: "Care Business Launch Kit",
        email: "buyer@carelicensingsolution.com",
      },
      {
        fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
          calledUrl = String(url);
          calledBody = String(init?.body || "");
          return new Response("{}", { status: 200 });
        }) as typeof fetch,
      },
    );
    assert.deepEqual(result, { sent: true, reason: "sent" });
    assert.match(calledUrl, /\/v23\.0\/1234567890123\/events$/);
    assert.equal(new URL(calledUrl).searchParams.get("access_token"), null);
    const parsed = JSON.parse(calledBody) as { access_token: string; data: { event_id: string; custom_data: { value: number } }[] };
    assert.equal(parsed.access_token, "test-token");
    assert.equal(parsed.data[0].event_id, "pi_kit");
    assert.equal(parsed.data[0].custom_data.value, 647);
    assert.equal(calledBody.includes("buyer@carelicensingsolution.com"), false);
  });

  it("does not post a $0 purchase unless a test event code is set", async () => {
    rememberEnv();
    delete process.env.META_CAPI_TEST_EVENT_CODE;
    process.env.META_PIXEL_ID = "2202480640703362";
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    let calls = 0;
    const result = await sendMetaCapiPurchase(
      {
        eventId: "cs_live_free",
        value: 0,
        contentIds: ["mrr_47"],
        contentName: "State Market Research Report",
        email: "mary@example.com",
      },
      {
        fetchImpl: (async () => {
          calls += 1;
          return new Response("{}", { status: 200 });
        }) as typeof fetch,
      },
    );
    assert.deepEqual(result, { sent: false, reason: "unpaid" });
    assert.equal(calls, 0);
  });

  it("sends a $0 purchase only as a Test Event", async () => {
    rememberEnv();
    process.env.META_PIXEL_ID = "2202480640703362";
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    process.env.META_CAPI_TEST_EVENT_CODE = "TEST12345";
    let calledBody = "";
    const result = await sendMetaCapiPurchase(
      {
        eventId: "cs_live_free",
        value: 0,
        contentIds: ["mrr_47"],
        contentName: "State Market Research Report",
        email: "mary@example.com",
        clientIp: "203.0.113.8",
        userAgent: "Mozilla/5.0 Test Browser",
      },
      {
        fetchImpl: (async (_url: string | URL | Request, init?: RequestInit) => {
          calledBody = String(init?.body || "");
          return new Response("{}", { status: 200 });
        }) as typeof fetch,
      },
    );
    assert.deepEqual(result, { sent: true, reason: "sent" });
    const parsed = JSON.parse(calledBody) as {
      test_event_code?: string;
      data: { event_name: string; custom_data: { value: number } }[];
    };
    assert.equal(parsed.test_event_code, "TEST12345");
    assert.equal(parsed.data[0].event_name, "Purchase");
    assert.equal(parsed.data[0].custom_data.value, 0);
  });
});

describe("Meta CAPI InitiateCheckout", () => {
  it("matches on ip and user agent when Stripe has not collected an email yet", () => {
    const body = buildMetaInitiateCheckoutBody({
      eventId: "cs_live_front",
      value: 47,
      contentIds: ["mrr_47"],
      contentName: "State Market Research Report",
      clientIp: "203.0.113.8",
      userAgent: "Mozilla/5.0 Test Browser",
      fbp: "fb.1.1700000000000.123456",
      fbclid: "IwAR0click",
    });
    assert.ok(body);
    const event = body.data[0] as {
      event_name: string;
      event_id: string;
      user_data: { fbp?: string; fbc?: string; client_ip_address?: string; em?: string[] };
      custom_data: { value: number; content_ids: string[] };
    };
    assert.equal(event.event_name, "InitiateCheckout");
    assert.equal(event.event_id, "cs_live_front");
    assert.equal(event.custom_data.value, 47);
    assert.deepEqual(event.custom_data.content_ids, ["mrr_47"]);
    assert.equal(event.user_data.fbp, "fb.1.1700000000000.123456");
    assert.equal(event.user_data.client_ip_address, "203.0.113.8");
    assert.match(event.user_data.fbc || "", /^fb\.1\.\d+\.IwAR0click$/);
    assert.equal(event.user_data.em, undefined);
    assert.equal(buildMetaInitiateCheckoutBody({
      eventId: "cs_live_front",
      value: 47,
      contentIds: ["mrr_47"],
      contentName: "State Market Research Report",
    }), null);
  });

  it("posts InitiateCheckout with the checkout session id", async () => {
    rememberEnv();
    delete process.env.META_CAPI_TEST_EVENT_CODE;
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    process.env.META_PIXEL_ID = "2202480640703362";
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    let calledUrl = "";
    let calledBody = "";
    const result = await sendMetaCapiInitiateCheckout(
      {
        eventId: "cs_live_front",
        value: 47,
        contentIds: ["mrr_47"],
        contentName: "State Market Research Report",
        clientIp: "203.0.113.8",
        userAgent: "Mozilla/5.0 Test Browser",
      },
      {
        fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
          calledUrl = String(url);
          calledBody = String(init?.body || "");
          return new Response("{}", { status: 200 });
        }) as typeof fetch,
      },
    );
    assert.equal(result.reason, "sent");
    assert.match(calledUrl, /\/v23\.0\/2202480640703362\/events$/);
    const parsed = JSON.parse(calledBody) as { test_event_code?: string; data: { event_id: string; event_name: string }[] };
    assert.equal(parsed.test_event_code, undefined);
    assert.equal(parsed.data[0].event_name, "InitiateCheckout");
    assert.equal(parsed.data[0].event_id, "cs_live_front");
  });
});

describe("Meta click ids", () => {
  it("keeps a real fbp and builds fbc from fbclid", () => {
    assert.equal(sanitizeFbp("not-a-cookie"), "");
    assert.equal(sanitizeFbp("fb.1.1700000000000.123456"), "fb.1.1700000000000.123456");
    const stored = metaAttributionMetadata(
      {
        fbp: "fb.1.1700000000000.123456",
        fbclid: "IwAR0click",
        clientIp: "203.0.113.8",
        userAgent: "Mozilla/5.0 Test Browser",
        sourceUrl: "https://carelicensingsolution.com/market-research/checkout?fbclid=IwAR0click",
      },
      ["https://carelicensingsolution.com"],
    );
    assert.equal(stored.meta_fbp, "fb.1.1700000000000.123456");
    assert.match(stored.meta_fbc, /^fb\.1\.\d+\.IwAR0click$/);
    assert.equal(stored.meta_ip, "203.0.113.8");
    assert.match(stored.meta_url, /^https:\/\/carelicensingsolution.com\/market-research\/checkout/);
    assert.equal(metaAttributionMetadata({ sourceUrl: "https://evil.example/market-research" }).meta_url, undefined);
  });
});

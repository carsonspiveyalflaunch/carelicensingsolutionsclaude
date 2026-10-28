import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { LEGAL_EMAIL } from "./legal.ts";
import {
  ORDERS_FROM,
  buildMarketResearchReceipt,
  marketResearchDownloadUrl,
  marketResearchProductLine,
  queueFunnelEmail,
  sendMarketResearchReceipt,
} from "./funnel-email.ts";

const ENV_KEYS = ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO", "NEXT_PUBLIC_SITE_URL"] as const;
const saved: Record<string, string | undefined> = {};

function rememberEnv() {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

const sample = {
  email: "Buyer@Example.com",
  name: "Jane Buyer",
  sessionId: "cs_test_abc",
  state: "AZ",
  stateName: "Arizona",
  program: "Assisted Living",
  amount: 47,
};

describe("market research receipt copy", () => {
  it("names the buyer, the $47 report, the thank-you link, and support", () => {
    rememberEnv();
    process.env.NEXT_PUBLIC_SITE_URL = "https://carelicensingsolution.com/";
    process.env.EMAIL_FROM = "Care Licensing Solutions <orders@carelicensingsolution.com>";
    process.env.EMAIL_REPLY_TO = "someone-else@example.com";

    const receipt = buildMarketResearchReceipt(sample);
    assert.ok(receipt);
    assert.equal(receipt.from, "Care Licensing Solutions <orders@carelicensingsolution.com>");
    assert.equal(receipt.replyTo, LEGAL_EMAIL);
    assert.equal(receipt.to, "buyer@example.com");
    assert.match(receipt.subject, /Jane/);
    assert.match(receipt.text, /Jane Buyer/);
    assert.match(receipt.text, /State Market Research Report for Arizona \/ Assisted Living \(\$47\)/);
    assert.equal(
      receipt.downloadUrl,
      "https://carelicensingsolution.com/market-research/thank-you?session_id=cs_test_abc",
    );
    assert.match(receipt.text, new RegExp(receipt.downloadUrl.replace(/[?]/g, "\\?")));
    assert.match(receipt.html, /support@carelicensingsolution\.com/);
    assert.match(receipt.html, /\/contact/);
    assert.equal(receipt.html.includes("/object/sign"), false);
    assert.equal(receipt.html.includes("token="), false);
    assert.equal(receipt.idempotencyKey, "meta-mrr-purchased/cs_test_abc");
  });

  it("uses the state code when the display name is missing", () => {
    assert.equal(
      marketResearchProductLine({ state: "tx", program: "Home Care", amount: 47 }),
      "State Market Research Report for Texas / Home Care ($47)",
    );
  });

  it("omits the price when the amount is missing", () => {
    assert.equal(
      marketResearchProductLine({ stateName: "Ohio", program: "Adult Day" }),
      "State Market Research Report for Ohio / Adult Day",
    );
  });

  it("escapes the buyer name in html", () => {
    rememberEnv();
    const receipt = buildMarketResearchReceipt({
      ...sample,
      name: `Jane <script>`,
    });
    assert.ok(receipt);
    assert.equal(receipt.html.includes("<script>"), false);
    assert.match(receipt.html, /Jane &lt;script&gt;/);
  });

  it("falls back to orders@ when EMAIL_FROM is a different mailbox", () => {
    rememberEnv();
    process.env.EMAIL_FROM = "Care Licensing Solutions <support@carelicensingsolution.com>";
    const receipt = buildMarketResearchReceipt(sample);
    assert.equal(receipt?.from, ORDERS_FROM);
  });

  it("builds the thank-you url from the public site address", () => {
    rememberEnv();
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com";
    assert.equal(
      marketResearchDownloadUrl("cs_live_1"),
      "https://preview.example.com/market-research/thank-you?session_id=cs_live_1",
    );
  });
});

describe("market research receipt send", () => {
  it("skips Resend when there is no buyer email", async () => {
    rememberEnv();
    process.env.RESEND_API_KEY = "re_test";
    let called = false;
    const result = await queueFunnelEmail(
      "meta_mrr_purchased",
      { ...sample, email: "  " },
      { fetchImpl: (async () => {
        called = true;
        return new Response("{}", { status: 200 });
      }) as typeof fetch },
    );
    assert.deepEqual(result, { queued: false, reason: "no-email" });
    assert.equal(called, false);
  });

  it("does not send without a checkout session id", async () => {
    rememberEnv();
    process.env.RESEND_API_KEY = "re_test";
    let called = false;
    const result = await sendMarketResearchReceipt(
      { ...sample, sessionId: "" },
      { fetchImpl: (async () => {
        called = true;
        return new Response("{}", { status: 200 });
      }) as typeof fetch },
    );
    assert.deepEqual(result, { queued: false, reason: "no-session" });
    assert.equal(called, false);
  });

  it("returns no-resend when the API key is missing", async () => {
    rememberEnv();
    delete process.env.RESEND_API_KEY;
    const result = await queueFunnelEmail("meta_mrr_purchased", sample);
    assert.deepEqual(result, { queued: false, reason: "no-resend" });
  });

  it("posts to Resend with the orders from address, support reply-to, and session idempotency key", async () => {
    rememberEnv();
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = ORDERS_FROM;
    process.env.EMAIL_REPLY_TO = "c.spivey@alflaunch.com";
    process.env.NEXT_PUBLIC_SITE_URL = "https://carelicensingsolution.com";
    let headers: Headers | undefined;
    let body = "";
    const result = await queueFunnelEmail("meta_mrr_purchased", sample, {
      fetchImpl: (async (_url, init) => {
        headers = new Headers(init?.headers);
        body = String(init?.body || "");
        return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
      }) as typeof fetch,
    });
    assert.deepEqual(result, { queued: true, reason: "sent", id: "email_123" });
    assert.equal(headers?.get("authorization"), "Bearer re_test");
    assert.equal(headers?.get("idempotency-key"), "meta-mrr-purchased/cs_test_abc");
    const parsed = JSON.parse(body) as { from: string; to: string[]; reply_to: string; html: string; text: string };
    assert.equal(parsed.from, ORDERS_FROM);
    assert.deepEqual(parsed.to, ["buyer@example.com"]);
    assert.equal(parsed.reply_to, "support@carelicensingsolution.com");
    assert.match(parsed.text, /Jane Buyer/);
    assert.match(parsed.text, /\$47/);
    assert.match(parsed.html, /market-research\/thank-you\?session_id=cs_test_abc/);
    assert.equal(parsed.html.includes("/object/sign"), false);
  });

  it("logs a Resend failure and does not throw", async () => {
    rememberEnv();
    process.env.RESEND_API_KEY = "re_test";
    const result = await queueFunnelEmail("meta_mrr_purchased", sample, {
      fetchImpl: (async () => new Response(JSON.stringify({ name: "validation_error", message: "no" }), { status: 422 })) as typeof fetch,
    });
    assert.deepEqual(result, { queued: false, reason: "resend-failed" });
  });

  it("returns resend-network when fetch throws", async () => {
    rememberEnv();
    process.env.RESEND_API_KEY = "re_test";
    const result = await sendMarketResearchReceipt(sample, {
      fetchImpl: (async () => {
        throw new Error("socket hang up");
      }) as typeof fetch,
    });
    assert.deepEqual(result, { queued: false, reason: "resend-network" });
  });

  it("leaves the launch-kit hooks as logs", async () => {
    rememberEnv();
    process.env.RESEND_API_KEY = "re_test";
    let called = false;
    const result = await queueFunnelEmail(
      "meta_mrr_launch_kit_declined",
      sample,
      { fetchImpl: (async () => {
        called = true;
        return new Response("{}", { status: 200 });
      }) as typeof fetch },
    );
    assert.deepEqual(result, { queued: false, reason: "esp-not-wired" });
    assert.equal(called, false);
  });
});

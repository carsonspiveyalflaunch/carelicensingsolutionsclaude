import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { skoolInviteUrl } from "./community.ts";
import { readFunnelPromo } from "./funnel-promo.ts";
import { INDIVIDUAL_ITEM_PRICES } from "./pricing.ts";
import { isFunnelProxyPath } from "./program-codes.ts";
import { isCompleteBundleLine } from "./skool-invite.ts";
import { readItemsMetadata } from "./stripe-items.ts";
import {
  buildStatePackItems,
  buildStatePackReceipt,
  buildStatePackSessionParams,
  queueStatePackPurchaseEmail,
  readStatePackPromo,
  statePackOrderSummary,
  STATE_PACK_PROMO,
} from "./state-pack.ts";
import {
  STATE_PACK_PRICE_DOLLARS,
  isStatePackCancelUrl,
  isStatePackSuccessUrl,
  opaqueStatePackUrl,
  statePackFilePrices,
  statePackHref,
  statePackPerPackTotal,
  statePackSeparateTotal,
  statePackSuccessPath,
} from "./state-pack-shared.ts";
import type { FunnelBundle } from "./meta-funnel.ts";

const BUNDLES: FunnelBundle[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    product_slug: "texas-assisted-living-facilities-complete-bundle",
    name: "Texas Assisted Living Facilities Complete Bundle",
    code: "TX",
    state: "Texas",
    program: "Assisted Living Facilities",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    product_slug: "texas-hospice-programs-complete-bundle",
    name: "Texas Hospice Programs Complete Bundle",
    code: "TX",
    state: "Texas",
    program: "Hospice Programs",
  },
];

const ENV_KEYS = [
  "SKOOL_INVITE_URL",
  "NEXT_PUBLIC_SKOOL_INVITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "RESEND_API_KEY",
  "STRIPE_CHECKOUT_RECOVERY",
] as const;
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

describe("state pack checkout", () => {
  it("charges $997 for every program pack and leaves the shop report at $397", () => {
    assert.equal(STATE_PACK_PRICE_DOLLARS, 997);
    assert.equal(INDIVIDUAL_ITEM_PRICES["Market Research Report"], 397);
    const items = buildStatePackItems(BUNDLES);
    assert.equal(items.length, 2);
    assert.equal(items.reduce((sum, item) => sum + item.price, 0), 997);
    for (const item of items) {
      assert.equal(Object.hasOwn(item, "purchased_item"), false);
      assert.equal(isCompleteBundleLine(item), true);
    }
    assert.throws(() => buildStatePackItems([]), /isn't available/);
  });

  it("anchors the value stack to the four file prices and does not price Skool", () => {
    const lines = statePackFilePrices();
    assert.ok(lines);
    assert.deepEqual(
      lines.map((line) => line.price),
      [
        INDIVIDUAL_ITEM_PRICES["Market Research Report"],
        INDIVIDUAL_ITEM_PRICES["Pro Forma P&L Template"],
        INDIVIDUAL_ITEM_PRICES["Policy & Procedure Manual"],
        INDIVIDUAL_ITEM_PRICES["Licensing Checklist"],
      ],
    );
    const perPack = statePackPerPackTotal();
    assert.equal(perPack, 397 + 297 + 497 + 397);
    assert.equal(statePackSeparateTotal(2), (perPack || 0) * 2);
    assert.equal(statePackSeparateTotal(0), null);
    assert.equal(JSON.stringify(lines).includes("Skool"), false);
  });

  it("builds one $997 Checkout line and does not pin payment_method_types", () => {
    rememberEnv();
    delete process.env.STRIPE_CHECKOUT_RECOVERY;
    const items = buildStatePackItems(BUNDLES);
    const params = buildStatePackSessionParams({
      code: "TX",
      stateName: "Texas",
      items,
      applied: null,
      charged: 997,
      subtotal: 997,
      successUrl: "https://carelicensingsolution.com/market-research/state/thank-you?session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: "https://carelicensingsolution.com/market-research/state?state=TX",
      saveCard: true,
      paymentIntent: true,
      collectIfRequired: true,
    });
    assert.equal(Object.hasOwn(params, "payment_method_types"), false);
    assert.equal(params.line_items?.length, 1);
    const line = params.line_items?.[0];
    assert.equal(line && "price_data" in line ? line.price_data?.unit_amount : 0, 99700);
    assert.equal(line && "price_data" in line ? line.price_data?.product_data?.name : "", "Texas — all program packs");
    assert.match(String(line && "price_data" in line ? line.price_data?.product_data?.description : ""), /Skool/);
    assert.doesNotMatch(JSON.stringify(params.line_items), /Hospice|Assisted Living/);
    assert.equal(params.allow_promotion_codes, true);
    assert.equal(params.success_url?.includes("type="), false);
    assert.doesNotMatch(params.success_url || "", /hospice/i);
    const stored = readItemsMetadata(params.metadata);
    assert.equal(stored.length, 2);
    assert.equal(stored.some((item) => item.purchased_item), false);
    assert.equal(stored.some((item) => String(item.product_slug).includes("hospice-programs")), true);
  });

  it("applies only the one-time state-pack code and keeps it off the $47 checkout", () => {
    assert.equal(readStatePackPromo({ promo: "clsstate1" }), STATE_PACK_PROMO);
    assert.equal(readStatePackPromo({}), null);
    assert.throws(() => readStatePackPromo({ promotionCode: "CLSFREE1" }), /can't be used/);
    assert.throws(() => readStatePackPromo({ promotionCode: "LAUNCH20" }), /can't be used/);
    assert.throws(() => readFunnelPromo({ promotionCode: "CLSSTATE1" }), /can't be used/);

    const params = buildStatePackSessionParams({
      code: "TX",
      stateName: "Texas",
      items: buildStatePackItems(BUNDLES),
      applied: { id: "promo_state", code: "CLSSTATE1", percent: 100, total: 0 },
      charged: 0,
      subtotal: 997,
      successUrl: "https://carelicensingsolution.com/market-research/state/thank-you?session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: "https://carelicensingsolution.com/market-research/state?state=TX&promo=CLSSTATE1",
      saveCard: false,
      paymentIntent: false,
      collectIfRequired: true,
    });
    assert.deepEqual(params.discounts, [{ promotion_code: "promo_state" }]);
    assert.equal(params.payment_method_collection, "if_required");
    assert.equal(params.allow_promotion_codes, undefined);
    assert.equal(Object.hasOwn(params, "payment_method_types"), false);
    assert.equal(params.payment_intent_data, undefined);
  });

  it("keeps program names out of the state-pack URLs", () => {
    const href = statePackHref("tx", "?state=AZ&type=Hospice+Programs&p=hsp&promo=CLSSTATE1&fbclid=1");
    assert.equal(href, "/market-research/state?state=TX&promo=CLSSTATE1&fbclid=1");
    assert.doesNotMatch(href, /hospice|type=|program=|p=/i);
    const success = statePackSuccessPath("?type=Hospice+Programs&fbclid=IwAR");
    assert.match(success, /session_id=\{CHECKOUT_SESSION_ID\}/);
    assert.match(success, /fbclid=IwAR/);
    assert.doesNotMatch(success, /hospice|type=/i);
    const origins = ["https://carelicensingsolution.com"];
    assert.equal(
      isStatePackSuccessUrl(`https://carelicensingsolution.com${success}`, origins),
      true,
    );
    assert.equal(
      isStatePackSuccessUrl(
        "https://carelicensingsolution.com/market-research/state/thank-you?session_id={CHECKOUT_SESSION_ID}&type=Hospice+Programs",
        origins,
      ),
      false,
    );
    assert.equal(
      isStatePackCancelUrl("https://carelicensingsolution.com/market-research/state?state=TX", origins),
      true,
    );
    assert.equal(
      isStatePackCancelUrl("https://carelicensingsolution.com/market-research/checkout?state=TX&p=hsp", origins),
      false,
    );
    const opaque = opaqueStatePackUrl(
      "https://carelicensingsolution.com/market-research/state?state=TX&type=Hospice+Programs&p=hsp&fbclid=1",
    );
    assert.equal(opaque, "https://carelicensingsolution.com/market-research/state?state=TX&fbclid=1");
    assert.equal(isFunnelProxyPath("/market-research/state"), true);
    assert.equal(isFunnelProxyPath("/market-research/state/thank-you"), true);
  });
});

describe("state pack receipt", () => {
  it("lists every program asset and a Skool invite that is not a program URL", () => {
    rememberEnv();
    process.env.NEXT_PUBLIC_SITE_URL = "https://carelicensingsolution.com";
    delete process.env.SKOOL_INVITE_URL;
    delete process.env.NEXT_PUBLIC_SKOOL_INVITE_URL;
    const receipt = buildStatePackReceipt({
      email: "Buyer@Example.com",
      name: "Jane Buyer",
      sessionId: "cs_test_state",
      state: "TX",
      stateName: "Texas",
      programs: ["Hospice Programs", "Assisted Living Facilities"],
      amount: 997,
    });
    assert.ok(receipt);
    assert.match(receipt.subject, /Jane/);
    assert.match(receipt.text, /Assisted Living Facilities/);
    assert.match(receipt.text, /Hospice Programs/);
    assert.match(receipt.text, /Market Research Report/);
    assert.match(receipt.text, /Pro Forma P&L Template/);
    assert.match(receipt.text, /Policy & Procedure Manual/);
    assert.match(receipt.text, /Licensing Checklist/);
    assert.match(receipt.text, /Skool community access/);
    assert.match(receipt.skoolUrl, /^https:\/\/www\.skool\.com\/carelicensingsolutions\?invite=/);
    assert.match(receipt.text, new RegExp(receipt.skoolUrl.replace(/[?]/g, "\\?")));
    assert.equal(receipt.downloadUrl, "https://carelicensingsolution.com/market-research/state/thank-you?session_id=cs_test_state");
    assert.doesNotMatch(receipt.downloadUrl, /hospice|type=|program=/i);
    assert.equal(receipt.html.includes("/object/sign"), false);

    process.env.SKOOL_INVITE_URL = "javascript:alert(1)";
    assert.match(skoolInviteUrl(), /^https:\/\/www\.skool\.com\//);
    process.env.SKOOL_INVITE_URL = "https://www.skool.com/carelicensingsolutions?invite=qa";
    assert.equal(skoolInviteUrl(), "https://www.skool.com/carelicensingsolutions?invite=qa");
  });

  it("skips the send when Resend is not configured", async () => {
    rememberEnv();
    delete process.env.RESEND_API_KEY;
    const result = await queueStatePackPurchaseEmail({
      id: "cs_test_state",
      amount_total: 100,
      customer_details: { email: "buyer@example.com", name: "Jane Buyer" },
      metadata: {
        state: "TX",
        state_name: "Texas",
        items: JSON.stringify([
          {
            product_slug: "texas-hospice-programs-complete-bundle",
            type: "Hospice Programs",
            state: "TX",
          },
        ]),
      },
    });
    assert.equal(result.queued, false);
    assert.equal(result.reason, "no-resend");
    const summary = statePackOrderSummary({
      id: "cs_test_state",
      amount_total: 100,
      customer_details: { email: "buyer@example.com" },
      metadata: {
        state: "TX",
        state_name: "Texas",
        items: JSON.stringify([
          { product_slug: "texas-hospice-programs-complete-bundle", type: "Hospice Programs" },
          { product_slug: "texas-assisted-living-facilities-complete-bundle", type: "Assisted Living Facilities" },
        ]),
      },
    });
    assert.equal(summary.amount, 1);
    assert.deepEqual(summary.contentIds, ["state_pack_997"]);
    assert.deepEqual(
      summary.programs.map((program) => program.program),
      ["Assisted Living Facilities", "Hospice Programs"],
    );
    assert.equal(summary.programs[0].assets.length, 4);
    assert.match(summary.skoolUrl, /^https:\/\/www\.skool\.com\//);
  });
});

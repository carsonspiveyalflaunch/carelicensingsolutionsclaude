import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INDIVIDUAL_ITEM_PRICES, resolveCartItems } from "./pricing.ts";
import { ASSET_LIST_PRICES } from "./value-stack.ts";
import { mergePurchasedItems } from "./purchased-items.ts";
import {
  CONTENT_LAUNCH_KIT,
  CONTENT_MRR,
  LAUNCH_KIT_PRICE_DOLLARS,
  MRR_CREDIT_DOLLARS,
  MRR_PRICE_DOLLARS,
  UPSELL_PRICE_DOLLARS,
  UPSELL_SAVINGS_DOLLARS,
  buildFunnelItems,
  buildLaunchKitItem,
  checkoutHref,
  creditActive,
  creditExpiresAt,
  funnelContentIds,
  funnelTotalDollars,
  isFunnelCancelUrl,
  isFunnelSuccessUrl,
  thankYouLaunchKitOffer,
  upsellAmountCents,
  upsellCheckoutDescription,
  type FunnelBundle,
} from "./meta-funnel.ts";

const BUNDLE: FunnelBundle = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  product_slug: "texas-personal-home-care-complete-bundle",
  name: "Texas Personal Home Care Complete Bundle",
  code: "TX",
  state: "Texas",
  program: "Personal Home Care",
};

describe("shop prices stay on the catalog", () => {
  it("keeps the a-la-carte report and checklist at $397", () => {
    assert.equal(INDIVIDUAL_ITEM_PRICES["Market Research Report"], 397);
    assert.equal(INDIVIDUAL_ITEM_PRICES["Licensing Checklist"], 397);
    assert.equal(ASSET_LIST_PRICES.report, 397);
    assert.equal(ASSET_LIST_PRICES.checklist, 397);
  });

  it("ignores a $47 client price on the normal cart", async () => {
    const supabase = { from() { throw new Error("catalog should not be required"); } };
    const [item] = await resolveCartItems(supabase, [
      {
        product_slug: BUNDLE.product_slug,
        name: "Market Research Report",
        price: 47,
        quantity: 1,
        state: "TX",
        type: "Personal Home Care",
        purchased_item: "Market Research Report",
      },
    ]);
    assert.equal(item.price, 397);
    assert.equal(item.purchased_item, "Market Research Report");
  });
});

describe("meta funnel sku", () => {
  it("charges $47 for the report and does not add a checklist or course bump", () => {
    const items = buildFunnelItems(BUNDLE);
    assert.deepEqual(items.map((item) => item.price), [MRR_PRICE_DOLLARS]);
    assert.equal(items.length, 1);
    assert.equal(funnelTotalDollars(), 47);
    assert.deepEqual(funnelContentIds(), [CONTENT_MRR]);
    assert.equal(items[0].purchased_item, "Market Research Report");
    assert.equal(items.some((item) => item.purchased_item === "Licensing Checklist"), false);
    assert.match(items[0].name, /Texas Personal Home Care — Market Research Report/);
  });

  it("charges $647 for the launch kit inside the credit window and leaves the catalog at $997", () => {
    const boughtAt = Date.parse("2026-10-26T12:00:00.000Z");
    assert.equal(LAUNCH_KIT_PRICE_DOLLARS, 997);
    assert.equal(MRR_CREDIT_DOLLARS, 47);
    assert.equal(UPSELL_PRICE_DOLLARS, 647);
    assert.equal(UPSELL_SAVINGS_DOLLARS, 350);
    assert.equal(creditActive(boughtAt, boughtAt + 7 * 24 * 60 * 60 * 1000), true);
    assert.equal(creditActive(boughtAt, creditExpiresAt(boughtAt) + 1), false);
    assert.equal(upsellAmountCents(boughtAt, boughtAt), 64700);
    assert.equal(upsellAmountCents(boughtAt, creditExpiresAt(boughtAt) + 1), LAUNCH_KIT_PRICE_DOLLARS * 100);
    const kit = buildLaunchKitItem(BUNDLE, UPSELL_PRICE_DOLLARS);
    assert.equal(kit.price, 647);
    assert.equal("purchased_item" in kit, false);
    assert.equal(CONTENT_LAUNCH_KIT, "launch_kit_997");
  });

  it("tells the thank-you buyer the Launch Kit charge is $647", () => {
    const offer = thankYouLaunchKitOffer();
    const checkout = upsellCheckoutDescription();
    assert.equal(offer, "You pay $647 for the Launch Kit. Your $47 report credit is applied — about $350 off.");
    assert.equal(checkout, "Care Business Launch Kit. You pay $647.");
    assert.doesNotMatch(`${offer} ${checkout}`, /847|950|997/);
  });

  it("only accepts funnel return urls on our origin", () => {
    const ok = "http://localhost:3000/market-research/upsell?session_id={CHECKOUT_SESSION_ID}&fbclid=1";
    assert.equal(isFunnelSuccessUrl(ok, ["http://localhost:3000"]), true);
    assert.equal(isFunnelSuccessUrl("https://evil.example/market-research/upsell?session_id={CHECKOUT_SESSION_ID}", ["http://localhost:3000"]), false);
    assert.equal(isFunnelSuccessUrl("http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}", ["http://localhost:3000"]), false);
    assert.equal(isFunnelCancelUrl("http://localhost:3000/market-research/checkout?state=TX", ["http://localhost:3000"]), true);
    const back = checkoutHref("AZ", "Residential Care (DD)", "?state=AZ&type=Residential+Care+%28DD%29&promo=CLSFREE1");
    assert.match(back, /promo=CLSFREE1/);
    assert.match(back, /state=AZ/);
  });
});

describe("bundle access merge", () => {
  it("upgrades a single report to the full kit and never narrows it back", () => {
    assert.deepEqual(mergePurchasedItems(undefined, ["Market Research Report"]), ["Market Research Report"]);
    assert.equal(mergePurchasedItems(["Market Research Report"], null), null);
    assert.equal(mergePurchasedItems(null, ["Market Research Report"]), null);
    const both = mergePurchasedItems(["Market Research Report"], ["Licensing Checklist"]);
    assert.ok(Array.isArray(both));
    assert.deepEqual([...both].sort(), ["Licensing Checklist", "Market Research Report"]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HI_PERSONAL_HOME_CARE, isHiPersonalHomeCare, withoutUnavailableReports } from "./funnel-catalog.ts";
import { upsellPurchaseEventId } from "./funnel-fulfill.ts";

describe("funnel report choices", () => {
  it("drops Hawaii Personal Home Care only when that report is unavailable", () => {
    const choices = [
      { code: "HI", program: "Personal Home Care" },
      { code: "HI", program: "Residential Care (DD)" },
      { code: "TX", program: "Personal Home Care" },
    ];
    assert.equal(isHiPersonalHomeCare(choices[0]), true);
    assert.equal(isHiPersonalHomeCare(choices[1]), false);
    assert.equal(withoutUnavailableReports(choices, []).length, 3);
    assert.deepEqual(withoutUnavailableReports(choices, [HI_PERSONAL_HOME_CARE]), [
      { code: "HI", program: "Residential Care (DD)" },
      { code: "TX", program: "Personal Home Care" },
    ]);
  });

  it("uses the payment intent id for one-click kit purchases and the checkout session for hosted kit checkout", () => {
    assert.equal(
      upsellPurchaseEventId({ stripe_session_id: "pi_pi_123", stripe_payment_intent_id: "pi_123" }),
      "pi_123",
    );
    assert.equal(
      upsellPurchaseEventId({ stripe_session_id: "cs_test_kit", stripe_payment_intent_id: "pi_999" }),
      "cs_test_kit",
    );
    assert.equal(upsellPurchaseEventId(null), "");
  });
});

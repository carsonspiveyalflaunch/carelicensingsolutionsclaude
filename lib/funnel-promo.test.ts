import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  approximateFunnelDiscount,
  dollarsMetadata,
  funnelDiscountSessionFields,
  readFunnelPromo,
} from "./funnel-promo.ts";

describe("funnel server promotion codes", () => {
  it("ignores a missing code and allowlists the internal ones", () => {
    assert.equal(readFunnelPromo({}), null);
    assert.equal(readFunnelPromo({ promotionCode: "  " }), null);
    assert.equal(readFunnelPromo({ promotionCode: "clsfree1" }), "CLSFREE1");
    assert.equal(readFunnelPromo({ promoCode: "Clstest50" }), "CLSTEST50");
    assert.equal(readFunnelPromo({ promo: "CLSFREE1" }), "CLSFREE1");
  });

  it("rejects any other code before Stripe is called", () => {
    assert.throws(() => readFunnelPromo({ promotionCode: "LAUNCH20" }), /can't be used/);
    assert.throws(() => readFunnelPromo({ promoCode: "CLSFREE1EXTRA" }), /can't be used/);
  });

  it("estimates a free and a half-off $47 report", () => {
    assert.deepEqual(approximateFunnelDiscount(47, { percent_off: 100 }), { percent: 100, total: 0 });
    assert.deepEqual(approximateFunnelDiscount(47, { percent_off: 50 }), { percent: 50, total: 23.5 });
    assert.equal(dollarsMetadata(0), "0");
    assert.equal(dollarsMetadata(47), "47");
    assert.equal(dollarsMetadata(23.5), "23.50");
  });

  it("applies the code server-side and leaves the promo box for a normal checkout", () => {
    const applied = funnelDiscountSessionFields({ id: "promo_123" });
    assert.deepEqual(applied.discounts, [{ promotion_code: "promo_123" }]);
    assert.equal(applied.payment_method_collection, "if_required");
    assert.equal(applied.allow_promotion_codes, undefined);

    const plain = funnelDiscountSessionFields(null);
    assert.equal(plain.allow_promotion_codes, true);
    assert.equal(plain.discounts, undefined);
    assert.equal(plain.payment_method_collection, undefined);
  });
});

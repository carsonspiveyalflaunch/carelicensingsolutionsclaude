import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GHL_FIELDS } from "./ghl.ts";
import { funnelBuyerCustomFields, funnelBuyerTags, syncFunnelBuyerInGhl } from "./ghl-funnel.ts";

describe("market research GoHighLevel tags", () => {
  it("tags a $47 buyer with state and program and not the kit", () => {
    assert.deepEqual(
      funnelBuyerTags({ launchKit: false, state: "AZ", program: "Residential Care (DD)" }),
      ["mrr-buyer", "mrr-state-az", "mrr-program-dd-group-home"],
    );
  });

  it("adds launch-kit-buyer after the kit is paid", () => {
    const tags = funnelBuyerTags({ launchKit: true, state: "az", program: "Residential Care (DD)" });
    assert.equal(tags[0], "mrr-buyer");
    assert.ok(tags.includes("launch-kit-buyer"));
    assert.equal(tags.includes("mrr-buyer") && tags.includes("launch-kit-buyer"), true);
  });

  it("writes state and program onto the existing ALF Launch custom fields", () => {
    const fields = funnelBuyerCustomFields({
      state: "AZ",
      stateName: "Arizona",
      program: "Residential Care (DD)",
    });
    assert.deepEqual(
      fields.map((field) => field.id),
      [GHL_FIELDS.stateName, GHL_FIELDS.stateCode, GHL_FIELDS.program, GHL_FIELDS.programPhrase],
    );
    assert.equal(fields[1].value, "AZ");
    assert.equal(fields[2].value, "Residential Care (DD)");
  });

  it("skips the API when no token is configured", async () => {
    const previous = {
      GHL_API_KEY: process.env.GHL_API_KEY,
      GHL_PRIVATE_TOKEN: process.env.GHL_PRIVATE_TOKEN,
    };
    delete process.env.GHL_API_KEY;
    delete process.env.GHL_PRIVATE_TOKEN;
    try {
      const result = await syncFunnelBuyerInGhl({
        email: "buyer@example.com",
        launchKit: false,
        state: "AZ",
        program: "Residential Care (DD)",
      });
      assert.equal(result.ok, false);
      assert.equal(result.reason, "no-token");
    } finally {
      if (previous.GHL_API_KEY === undefined) delete process.env.GHL_API_KEY;
      else process.env.GHL_API_KEY = previous.GHL_API_KEY;
      if (previous.GHL_PRIVATE_TOKEN === undefined) delete process.env.GHL_PRIVATE_TOKEN;
      else process.env.GHL_PRIVATE_TOKEN = previous.GHL_PRIVATE_TOKEN;
    }
  });
});

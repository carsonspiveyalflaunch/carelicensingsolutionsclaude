import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bundleAssetsFromFileNames, bundleOfferFlags } from "./bundle-offer.ts";

describe("bundle offer files", () => {
  it("marks a report available only when the market research file is in the folder", () => {
    const nd = bundleAssetsFromFileNames("north-dakota-adult-day-care-programs-complete-bundle", [
      "licensing-checklist.xlsx",
      "market-research-report.pdf",
      "policy-procedure-manual.pdf",
      "pro-forma-pl-template.xlsx",
    ]);
    assert.deepEqual(bundleOfferFlags(nd), { available: true, checklist: true });
  });

  it("does not invent a report when the catalog folder has no market research file", () => {
    const hi = bundleAssetsFromFileNames("hawaii-personal-home-care-complete-bundle", [
      "licensing-checklist.xlsx",
      "policy-procedure-manual.pdf",
      "pro-forma-pl-template.xlsx",
    ]);
    assert.deepEqual(bundleOfferFlags(hi), { available: false, checklist: true });
  });

  it("ignores names that are not the four sellable bundle resources", () => {
    const assets = bundleAssetsFromFileNames("texas-personal-home-care-complete-bundle", [
      "notes.txt",
      "../secret.pdf",
      ".env",
      "market-research-report.pdf",
      "market-research-report.docx",
    ]);
    assert.deepEqual(
      assets.map((asset) => asset.name),
      ["market-research-report.pdf"],
    );
    assert.equal(bundleOfferFlags(assets).available, true);
    assert.equal(bundleOfferFlags([]).available, false);
  });
});

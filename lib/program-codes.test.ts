import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROGRAMS_BY_STATE } from "../app/data/programAvailability.ts";
import { PROGRAM_ALIASES } from "./go-links.ts";
import { checkoutHref, launchKitHref } from "./meta-funnel.ts";
import {
  canonicalProgramName,
  cleanFunnelSearch,
  funnelOfferQuery,
  knownFunnelPrograms,
  programCodeForName,
  programNameFromCode,
  programQueryValue,
  resolveProgramInput,
  withCleanFunnelSearch,
} from "./program-codes.ts";

const HEALTH_TERMS = /hospice|nurs|health|disab|medic|snf|senior|therap|assisted|daycare|day\+care/i;

describe("program codes", () => {
  it("round-trips every mapped program and keeps codes free of health words", () => {
    const codes = new Set<string>();
    for (const { code, name } of knownFunnelPrograms()) {
      assert.equal(codes.has(code), false, code);
      codes.add(code);
      assert.equal(programCodeForName(name), code);
      assert.equal(programCodeForName(name.toLowerCase()), code);
      assert.equal(programNameFromCode(code), name);
      assert.equal(canonicalProgramName(code.toUpperCase()), name);
      assert.doesNotMatch(code, HEALTH_TERMS);
    }
    assert.equal(programCodeForName("Residential Care (DD)"), "rcdd");
    assert.equal(programNameFromCode("rcdd"), "Residential Care (DD)");
  });

  it("covers every sellable catalog program", () => {
    const mapped = new Set(knownFunnelPrograms().map((row) => row.name));
    const catalog = new Set<string>([
      ...Object.values(PROGRAMS_BY_STATE).flat(),
      ...Object.keys(PROGRAM_ALIASES),
    ]);
    for (const name of catalog) {
      assert.equal(mapped.has(name), true, name);
    }
  });

  it("reads p, then legacy type or program, and prefers p", () => {
    assert.equal(programQueryValue(new URLSearchParams("state=AZ&p=rcdd")), "Residential Care (DD)");
    assert.equal(
      programQueryValue(new URLSearchParams("type=Residential+Care+%28DD%29")),
      "Residential Care (DD)",
    );
    assert.equal(programQueryValue(new URLSearchParams("program=Hospice+Programs")), "Hospice Programs");
    assert.equal(programQueryValue(new URLSearchParams("type=hospice   programs")), "Hospice Programs");
    assert.equal(
      programQueryValue(new URLSearchParams("p=rcdd&type=Hospice+Programs")),
      "Residential Care (DD)",
    );
    assert.equal(programQueryValue(new URLSearchParams("type=Not+A+Real+Program")), "Not A Real Program");
    assert.equal(resolveProgramInput("rcdd"), "Residential Care (DD)");
    assert.equal(resolveProgramInput("Personal Home Care", "rcdd"), "Personal Home Care");
    assert.equal(resolveProgramInput("", "hsp"), "Hospice Programs");
  });

  it("rewrites old type and program query strings and leaves clean ones", () => {
    const cleaned = cleanFunnelSearch("?state=AZ&type=Residential+Care+%28DD%29&promo=CLSFREE1&fbclid=abc");
    assert.ok(cleaned);
    const params = new URLSearchParams(cleaned!);
    assert.equal(params.get("state"), "AZ");
    assert.equal(params.get("p"), "rcdd");
    assert.equal(params.get("promo"), "CLSFREE1");
    assert.equal(params.get("fbclid"), "abc");
    assert.equal(params.get("type"), null);
    assert.equal(params.get("program"), null);
    assert.equal(cleanFunnelSearch("state=TX&program=Personal+Home+Care"), "state=TX&p=phc");
    assert.equal(cleanFunnelSearch("state=AZ&p=hsp"), null);
    assert.equal(cleanFunnelSearch("type=Not+A+Real+Program"), null);
    assert.equal(
      withCleanFunnelSearch("https://carelicensingsolution.com/market-research/checkout?state=AZ&type=Hospice+Programs"),
      "https://carelicensingsolution.com/market-research/checkout?state=AZ&p=hsp",
    );
  });
});

describe("funnel urls omit program names", () => {
  it("builds checkout and launch-kit links with p= and strips a legacy type param", () => {
    for (const { code, name } of knownFunnelPrograms()) {
      for (const href of [
        checkoutHref("AZ", name, "?state=AZ&type=Residential+Care+%28DD%29&promo=CLSFREE1&fbclid=IwAR"),
        launchKitHref("AZ", name),
      ]) {
        const decoded = decodeURIComponent(href);
        assert.match(href, new RegExp(`(?:^|[?&])p=${code}(?:&|$)`));
        assert.doesNotMatch(href, /(?:^|[?&])(?:type|program)=/);
        assert.doesNotMatch(decoded, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
        assert.doesNotMatch(decoded, HEALTH_TERMS);
      }
      const offer = funnelOfferQuery("az", name);
      assert.match(offer, new RegExp(`(?:^|[?&])p=${code}(?:&|$)`));
      assert.match(offer, /(?:^|[?&])state=AZ(?:&|$)/);
      assert.doesNotMatch(offer, /(?:^|[?&])type=/);
    }

    const back = checkoutHref("AZ", "Residential Care (DD)", "?state=AZ&type=Residential+Care+%28DD%29&promo=CLSFREE1");
    assert.match(back, /promo=CLSFREE1/);
    assert.match(back, /state=AZ/);
    assert.equal(checkoutHref("AZ", "", "?state=AZ&p=rcdd&promo=KEEP"), "/market-research/checkout?state=AZ&promo=KEEP");
    const switched = new URLSearchParams(
      checkoutHref("TX", "Personal Home Care", "?state=AZ&type=Hospice+Programs&p=hsp&fbclid=1").split("?")[1],
    );
    assert.equal(switched.get("state"), "TX");
    assert.equal(switched.get("p"), "phc");
    assert.equal(switched.get("type"), null);
    assert.equal(switched.get("fbclid"), "1");
  });

  it("does not put an unknown program name on the url", () => {
    const href = checkoutHref("AZ", "Secret Hospice Name", "");
    assert.equal(href, "/market-research/checkout?state=AZ");
    assert.doesNotMatch(href, /Hospice|type=/);
  });
});

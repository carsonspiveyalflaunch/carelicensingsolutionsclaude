import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutDisplayName, humanizeProductSlug } from "./checkout-name.ts";
import { resolveCartItems } from "./pricing.ts";

const TX_HOME = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Texas Personal Home Care Complete Bundle",
  product_slug: "texas-personal-home-care-complete-bundle",
  price: 997,
  is_active: true,
  type: "bundle",
  state: "Texas",
  code: "TX",
  program: "Personal Home Care",
  product_label: "Complete Bundle",
};

const MD_DD = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  name: "Maryland Residential Care (DD) Complete Bundle",
  product_slug: "maryland-residential-care-dd-complete-bundle",
  price: 997,
  is_active: true,
  type: "bundle",
  state: "Maryland",
  code: "MD",
  program: "Residential Care (DD)",
  product_label: "Complete Bundle",
};

const MO_HOSPICE = {
  id: "ff8315f1-b868-4133-a20e-1ebc0979a0c9",
  name: "Missouri Hospice Programs Complete Bundle",
  product_slug: "missouri-hospice-programs-complete-bundle",
  price: 997,
  is_active: true,
  type: "bundle",
  state: "Missouri",
  code: "MO",
  program: "Hospice Programs",
  product_label: "Complete Bundle",
};

const VA_CHILD = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  name: "Virginia Child Care Facilities Complete Bundle",
  product_slug: "virginia-child-care-facilities-complete-bundle",
  price: 997,
  is_active: true,
  type: "bundle",
  state: "Virginia",
  code: "VA",
  program: "Child Care Facilities",
  product_label: "Complete Bundle",
};

const COURSE = {
  id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  name: "Care Licensing Solutions Operational Success Academy",
  product_slug: "course-operational-success-academy",
  price: 697,
  is_active: true,
  type: "course",
  state: "General",
  program: "Course",
  product_label: "Course",
};

const PNL = {
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  name: "Pro Forma P&L Template",
  product_slug: "pro-forma-pl-template",
  price: 297,
  is_active: true,
  type: "bundle",
  state: "General",
  program: "Financial",
  product_label: "Pro Forma P&L Template",
};

function mockSupabase(rows: any[]) {
  return {
    from() {
      const query: { eqs: [string, string][]; select: () => any; eq: (c: string, v: string) => any; limit: () => any; maybeSingle: () => Promise<{ data: any; error: null }> } = {
        eqs: [],
        select() {
          return query;
        },
        eq(col: string, val: string) {
          query.eqs.push([col, String(val)]);
          return query;
        },
        limit() {
          return query;
        },
        async maybeSingle() {
          const row =
            rows.find((candidate) =>
              query.eqs.every(([col, val]) => String(candidate[col] ?? "") === val),
            ) || null;
          return { data: row, error: null };
        },
      };
      return query;
    },
  };
}

function lineItem(item: any) {
  return {
    price_data: {
      currency: "usd",
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity || 1,
  };
}

describe("checkout display names", () => {
  it("humanizes state bundle slugs, including (DD)", () => {
    assert.equal(
      humanizeProductSlug("texas-personal-home-care-complete-bundle"),
      "Texas Personal Home Care Complete Bundle",
    );
    assert.equal(
      humanizeProductSlug("maryland-residential-care-dd-complete-bundle"),
      "Maryland Residential Care (DD) Complete Bundle",
    );
    assert.equal(
      humanizeProductSlug("missouri-hospice-programs-complete-bundle"),
      "Missouri Hospice Programs Complete Bundle",
    );
  });

  it("replaces a literal x with the catalog bundle name", () => {
    assert.equal(
      checkoutDisplayName(
        { product_slug: TX_HOME.product_slug, name: "x", price: 997, quantity: 1 },
        TX_HOME,
      ),
      TX_HOME.name,
    );
  });

  it("builds a bundle name from state and program when the catalog name is x", () => {
    assert.equal(
      checkoutDisplayName(
        { product_slug: MD_DD.product_slug, name: "x" },
        { ...MD_DD, name: "x" },
      ),
      "Maryland Residential Care (DD) Complete Bundle",
    );
  });

  it("qualifies a single resource bought from a complete-bundle slug", () => {
    assert.equal(
      checkoutDisplayName(
        {
          product_slug: MO_HOSPICE.product_slug,
          name: "Pro Forma P&L Template",
          purchased_item: "Pro Forma P&L Template",
        },
        MO_HOSPICE,
      ),
      "Missouri Hospice Programs — Pro Forma P&L Template",
    );
  });

  it("does not keep a single-item label on a full bundle purchase", () => {
    assert.equal(
      checkoutDisplayName(
        { product_slug: MO_HOSPICE.product_slug, name: "Pro Forma P&L Template" },
        MO_HOSPICE,
      ),
      MO_HOSPICE.name,
    );
  });

  it("uses the product the slug charges, not a different state's client name", () => {
    assert.equal(
      checkoutDisplayName(
        {
          product_slug: VA_CHILD.product_slug,
          name: "Utah Child Care Facilities Complete Bundle",
        },
        VA_CHILD,
      ),
      VA_CHILD.name,
    );
  });

  it("never returns x or an empty name", () => {
    for (const name of ["x", "X", "", "  ", "n/a", "null"]) {
      const result = checkoutDisplayName({ name, product_slug: TX_HOME.product_slug }, null);
      assert.notEqual(result, "x");
      assert.ok(result.trim().length > 2, result);
    }
    assert.equal(checkoutDisplayName({ name: "x" }, null), "Licensing Resource");
  });
});

describe("checkout session line items", () => {
  const supabase = mockSupabase([TX_HOME, MD_DD, MO_HOSPICE, VA_CHILD, COURSE, PNL]);

  it("dry-runs the live bad sessions into Stripe line-item payloads", async () => {
    const [texas] = await resolveCartItems(supabase, [
      { product_slug: TX_HOME.product_slug, name: "x", price: 1, quantity: 1 },
    ]);
    const [maryland] = await resolveCartItems(supabase, [
      { product_slug: MD_DD.product_slug, name: "x", price: 997, quantity: 1 },
    ]);
    const [missouriFile] = await resolveCartItems(supabase, [
      {
        product_slug: MO_HOSPICE.product_slug,
        name: "Pro Forma P&L Template",
        price: 297,
        quantity: 1,
        product_id: MO_HOSPICE.id,
        purchased_item: "Pro Forma P&L Template",
        purchased_item_price: 297,
      },
    ]);
    const [mislabeledBundle] = await resolveCartItems(supabase, [
      { product_slug: MO_HOSPICE.product_slug, name: "Pro Forma P&L Template", price: 50, quantity: 1 },
    ]);

    const payloads = {
      texasHomeCare: lineItem(texas),
      marylandDd: lineItem(maryland),
      missouriPnlFromBundle: lineItem(missouriFile),
      bundleMislabeledAsPnl: lineItem(mislabeledBundle),
    };

    assert.deepEqual(payloads.texasHomeCare, {
      price_data: {
        currency: "usd",
        product_data: { name: "Texas Personal Home Care Complete Bundle" },
        unit_amount: 99700,
      },
      quantity: 1,
    });
    assert.deepEqual(payloads.marylandDd, {
      price_data: {
        currency: "usd",
        product_data: { name: "Maryland Residential Care (DD) Complete Bundle" },
        unit_amount: 99700,
      },
      quantity: 1,
    });
    assert.deepEqual(payloads.missouriPnlFromBundle, {
      price_data: {
        currency: "usd",
        product_data: { name: "Missouri Hospice Programs — Pro Forma P&L Template" },
        unit_amount: 29700,
      },
      quantity: 1,
    });
    assert.equal(missouriFile.product_slug, MO_HOSPICE.product_slug);
    assert.equal(missouriFile.purchased_item, "Pro Forma P&L Template");
    assert.deepEqual(payloads.bundleMislabeledAsPnl, {
      price_data: {
        currency: "usd",
        product_data: { name: "Missouri Hospice Programs Complete Bundle" },
        unit_amount: 99700,
      },
      quantity: 1,
    });
  });

  it("keeps a correct bundle name and ignores a tampered price", async () => {
    const [item] = await resolveCartItems(supabase, [
      {
        product_slug: "virginia-child-care-facilities-complete-bundle",
        name: "Utah Child Care Facilities Complete Bundle",
        price: 1297,
        quantity: 1,
      },
    ]);
    assert.equal(item.name, "Virginia Child Care Facilities Complete Bundle");
    assert.equal(item.price, 997);
    assert.equal(lineItem(item).price_data.unit_amount, 99700);
  });

  it("names the course even when the client sends x, at the course price", async () => {
    const [item] = await resolveCartItems(supabase, [
      { product_slug: COURSE.product_slug, name: "x", price: 1, quantity: 1 },
    ]);
    assert.equal(item.name, COURSE.name);
    assert.equal(item.price, 697);
  });

  it("names a generic bundles-page id from the catalog row", async () => {
    const [item] = await resolveCartItems(supabase, [
      {
        id: "bundle-TX-Personal Home Care",
        name: "x",
        price: 1,
        quantity: 1,
        state: "TX",
        type: "Personal Home Care",
      },
    ]);
    assert.equal(item.name, TX_HOME.name);
    assert.equal(item.price, 997);
  });

  it("leaves a sample's own name in place", async () => {
    const [item] = await resolveCartItems(supabase, [
      { id: `${PNL.id}-sample`, name: "Pro Forma P&L Template", price: 1, quantity: 1 },
    ]);
    assert.equal(item.name, "Pro Forma P&L Template");
    assert.equal(item.price, 297);
  });
});

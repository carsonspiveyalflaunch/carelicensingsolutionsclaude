// Short, shareable sales-page links for bundles: /go/tx-assisted-living
// <two-letter state code>-<program alias>. Used in emails, texts and ads.

export const PROGRAM_ALIASES: Record<string, string> = {
  "Assisted Living Facilities": "assisted-living",
  "Personal Home Care": "home-care",
  "Residential Care (DD)": "dd-group-home",
  "Home Health Agencies": "home-health",
  "Nursing Facilities (SNF)": "nursing-facility",
  "Adult Day Care Programs": "adult-day-care",
  "Hospice Programs": "hospice",
  "Child Care Facilities": "child-care",
  "Group Homes for Children": "childrens-group-home",
  "Residential Treatment (Children)": "residential-treatment",
  "Ambulatory Surgical Centers": "surgery-center",
  "Intermediate Care Facilities": "icf",
};

const ALIAS_TO_PROGRAM: Record<string, string> = Object.fromEntries(
  Object.entries(PROGRAM_ALIASES).map(([program, alias]) => [alias, program]),
);

// What a buyer is opening, in plain words, for headlines.
export const PROGRAM_HEADLINE: Record<string, string> = {
  "Assisted Living Facilities": "an Assisted Living Facility",
  "Personal Home Care": "a Non-Medical Home Care Agency",
  "Residential Care (DD)": "a Group Home for Adults with Developmental Disabilities",
  "Home Health Agencies": "a Home Health Agency",
  "Nursing Facilities (SNF)": "a Skilled Nursing Facility",
  "Adult Day Care Programs": "an Adult Day Care Program",
  "Hospice Programs": "a Hospice Program",
  "Child Care Facilities": "a Child Care Facility",
  "Group Homes for Children": "a Group Home for Children",
  "Residential Treatment (Children)": "a Children's Residential Treatment Program",
  "Ambulatory Surgical Centers": "an Ambulatory Surgical Center",
  "Intermediate Care Facilities": "an Intermediate Care Facility",
};

export function goSlug(code: string, program: string): string | null {
  const alias = PROGRAM_ALIASES[program];
  return alias && code ? `${code.toLowerCase()}-${alias}` : null;
}

export function parseGoSlug(slug: string): { code: string; program: string } | null {
  const m = /^([a-z]{2})-([a-z-]+)$/.exec(String(slug || "").toLowerCase());
  if (!m) return null;
  const program = ALIAS_TO_PROGRAM[m[2]];
  return program ? { code: m[1].toUpperCase(), program } : null;
}

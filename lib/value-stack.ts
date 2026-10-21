/**
 * What a bundle buyer gets, with the prices the site actually charges.
 * Single-asset prices come from the products table at render time; the
 * course price matches the course checkout (app/api/course-enrollment).
 * Items without a price are included but never given an invented value.
 */
export const COURSE_PRICE_DOLLARS = 697;
export const COURSE_TITLE = "Operational Success Academy (video course)";
export const COURSE_DETAIL =
  "11 modules, 124 lessons: entity formation, finding your administrator, financing, facility acquisition, licensing and vendorization, insurance, hiring, marketing, resident intake and operations.";

export const SINGLE_ASSET_SLUGS = {
  report: "market-research-report",
  pnl: "pro-forma-pl-template",
  checklist: "licensing-checklist",
  manual: "policy-procedure-manual",
} as const;

export const COMMUNITY_EXTRAS = [
  {
    title: "Market research library",
    detail: "19 lessons on Medicaid waiver (HCBS) services across states: rates, service definitions, licensing timelines and referral pipelines.",
  },
  {
    title: "Weekly call recordings",
    detail: "Replays of our group calls, where owners work through real licensing and launch questions.",
  },
  {
    title: "Owner community",
    detail: "Ask questions and learn from other people licensing and launching their agencies right now.",
  },
];

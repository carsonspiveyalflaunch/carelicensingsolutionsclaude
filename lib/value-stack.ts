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

/** Single-asset list prices (match the products table); used where the page can't query it. */
export const ASSET_LIST_PRICES = { report: 397, pnl: 297, checklist: 397, manual: 497 } as const;

export const COMMUNITY_EXTRAS = [
  {
    title: "Weekly call recordings",
    detail: "Replays of our group calls, where owners work through real licensing and launch questions.",
  },
  {
    title: "Owner community",
    detail: "Ask questions and learn from other people licensing and launching their agencies right now.",
  },
];

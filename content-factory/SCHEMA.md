# Bundle research spec (Oklahoma standard)

One JSON file per bundle: `content-factory/research/<bundle-slug>.json`
(bundle slug = the website product slug, e.g. `california-assisted-living-facilities-complete-bundle`).

The generators build three customer files from this JSON alone:
the **Market Research Report** (PDF), the **Pro Forma P&L** (xlsx with live formulas) and the
**Licensing Checklist** (xlsx). So everything a customer reads must be in here, and every number
must trace to a source.

## Non-negotiable rules

1. **No number without a source.** Every rate, fee, count, wage, timeline, waitlist figure, ratio or
   capacity limit carries `source_id` pointing at `sources[]`. Prefer official sources: state agency
   sites, administrative code/statute (law.cornell.edu, state legislature sites, eCFR), CMS, SSA,
   BLS/O*NET, Medicaid fee schedules and rate notices. Trade associations (AHCA/NCAL, state provider
   associations) are acceptable as `secondary` for market-size figures only.
2. **If you cannot verify it, leave it out** and list it in `not_claimed` (like the Oklahoma report's
   "What This Report Does Not Claim"). Never estimate market shares, competitor names, provider counts
   or break-even points without a source. The generator computes break-even itself.
3. **Current values.** Use rates/fees in effect in 2026 (latest published). SSI federal benefit rate
   2026 = $994/month individual (SSA). BLS wages: latest OEWS (May 2025) state data. Wages must be at
   or above the state minimum wage in effect in 2026 (cite it). Note the effective date of every rate.
4. **Use the state's real program name and pathway.** E.g. California assisted living = RCFE licensed
   by CDSS Community Care Licensing (Title 22), funded privately and by the Medi-Cal Assisted Living
   Waiver; Florida ALF Medicaid is paid through SMMC LTC managed care plans (no state rate table).
   Say how money actually flows in this state for this program.
5. **Financial realism.** Model the configuration a real operator would run. Staffing must meet the
   state's actual staffing rules (cite them). Include every mandatory cost the rules create
   (administrator, RN oversight, required software/EVV, licensing renewals, insurance minimums).
   Payer mix must reflect reality (e.g. RCFE is mostly private pay; home health is mostly Medicare).
   Private-pay prices need a source (state cost-of-care survey, Genworth/CareScout 2024–2025, etc.).
6. **Profitability is shown honestly.** Provide several realistic `configurations` (sizes / service
   mixes / private-pay vs Medicaid mix). The generator finds which ones are profitable at the default
   occupancy and leads with those. Never raise a rate or drop a required cost to make a model profit.

## JSON shape

```jsonc
{
  "bundle_slug": "california-assisted-living-facilities-complete-bundle",
  "state": "California", "state_code": "CA",
  "program": "Assisted Living Facilities",          // website program name
  "state_program_name": "Residential Care Facility for the Elderly (RCFE)", // what the state calls it
  "as_of": "2026-10",                                // month the research was done
  "report_title": "California RCFE (Assisted Living) — Provider Market Research Report",

  "sources": [
    { "id": "S1", "title": "...", "publisher": "CA Dept. of Social Services", "url": "https://...",
      "type": "official|secondary", "accessed": "2026-10-13" }
  ],

  "key_numbers": [                                   // 6–12 rows for the Executive Summary table
    { "metric": "Initial license fee (4–6 beds)", "value": "$990", "source_id": "S3", "as_of": "2025" }
  ],
  "not_claimed": [ "Statewide provider market shares — no public source." ],

  "regulators": [
    { "name": "CDSS Community Care Licensing Division", "role": "Licensing and inspections",
      "url": "https://...", "phone": "...", "email": "...", "source_id": "S2" }
  ],
  "regulations": [
    { "cite": "22 CCR §87100 et seq.", "title": "RCFE regulations", "url": "https://...", "source_id": "S4" }
  ],

  "rates": [                                         // Appendix A + checklist Rates Reference
    { "payer": "Medi-Cal ALW", "code": "T2031", "service": "Assisted living, Tier 1",
      "rate": 95.69, "unit": "per day", "effective": "2025-07-01", "notes": "...", "source_id": "S6" }
  ],

  "sections": {                                      // narrative, markdown, cite inline as [S3]
    "executive_summary": "...",                      // opportunity snapshot (2–4 paragraphs)
    "service_model": "...",                          // Section 2: who is served, model, regulatory framework
    "licensing_pathway": "...",                      // Section 3: step-by-step pathway, fees, timelines
    "reimbursement": "...",                          // Section 4: payers, how money flows, rate context
    "demand": "...",                                 // Section 5: referral sources, waitlists, demographics
    "operations": "...",                             // Section 6: staffing rules, training, required systems
    "market_conditions": "...",                      // Section 7: supply, pricing, wages, trends
    "financial_narrative": "...",                    // Section 8 intro: how the P&L is built, key drivers
    "risks": "...",                                  // Section 9
    "recommendations": "..."                         // Section 10: concrete strategy to reach profit
  },

  "checklist": [                                     // 40–110 items, phased like the Oklahoma checklist
    { "phase": "PHASE 1 — BUSINESS FORMATION & LEGAL SETUP", "priority": "CRITICAL|HIGH|MEDIUM",
      "task": "...", "instructions": "how, where, cost, time", "cite": "HSC §1569.185", "source_id": "S3" }
  ],
  "contacts": [ { "name": "...", "role": "...", "contact": "phone / email / url" } ],

  "financial_model": {
    "capacity_unit": "resident",                     // resident | client | child | patient | procedure room
    "occupancy": { "default": 0.9, "conservative": 0.85, "optimistic": 0.95,
                   "rationale": "...", "source_id": "S9" },
    "ramp": { "start_clients": 1, "add_per_month": 1 },
    "configurations": [
      { "id": "rcfe6_private", "label": "6-bed RCFE, 100% private pay", "capacity": 6,
        "notes": "most common small-RCFE model",
        "revenue_lines": [
          { "name": "Private-pay monthly fee", "payer": "Private pay", "code": "",
            "rate": 5500, "unit": "per month", "units_per_client_month": 1,
            "share_of_clients": 1.0, "source_id": "S12" }
        ],
        "staffing": [                               // per-configuration because size drives staffing
          { "role": "Direct care staff (awake 24/7, 1 on shift)", "wage_hourly": 19.10,
            "wage_source_id": "S14", "basis": "hours_per_month", "amount": 730,
            "cite": "22 CCR §87411", "notes": "..." },
          { "role": "Administrator", "basis": "annual_salary", "amount": 60000, "wage_source_id": "S15" },
          { "role": "Med tech hours per resident", "wage_hourly": 20, "basis": "hours_per_client_month",
            "amount": 4, "wage_source_id": "S14" }
        ]
      }
    ],
    "default_configuration": "rcfe6_private",
    "payroll_burden": { "payroll_tax_pct": 0.095, "workers_comp_pct": 0.06, "benefits_pct": 0.10,
                        "notes": "state SUTA/WC rates cited where available", "source_id": "S16" },
    "opex": [                                        // monthly; basis fixed or per_client
      { "item": "Lease (6-bed home)", "monthly": 6000, "basis": "fixed", "notes": "...", "source_id": "S17" },
      { "item": "Food", "monthly": 300, "basis": "per_client" }
    ],
    "startup_costs": [ { "item": "Initial license fee", "low": 990, "high": 990, "source_id": "S3" } ]
  },

  "corrections_vs_previous": [                       // what the old Drive report got wrong
    "Old report stated a $2,946 initial fee; statute sets $990 for 4–6 beds (HSC §1569.185)."
  ]
}
```

## Lessons from the pilot fact-check (follow these — they were the most common errors)

- **Rent, utilities and other building costs are `fixed`, never `per_client`.** Size them per configuration
  with `opex_overrides` (e.g. per licensed bed × beds). Vacant beds still cost rent.
- **Entity-level taxes/fees by size:** state LLC/franchise/gross-receipts taxes, annual reports, business
  licenses. Size them per configuration (overrides). Check whether small homes are exempt from local licenses.
- **Wages:** statewide BLS is fine, but if a major metro has a higher local minimum wage than the modeled
  wage, say so in `financial_narrative` and `risks` with the result at that wage (recompute it).
  Keep leadership and field wages from the same geography as the revenue rates.
- **Fees:** state exactly when each fee is paid (with the application vs at issuance) and use the 2026 value
  (e.g. Medicaid provider enrollment application fee CY2026 = $750 — verify).
- **License category / application choices** must match the rule text exactly (e.g. "licensed and certified").
- **Timelines:** quote the rule's actual steps (e.g. 45 days completeness + 45 days decision), not a summary.
- **Managed care / Medicare Advantage rates** have no public fee schedule. Use a citable benchmark (10-K
  filings, MedPAC, state rate studies) and label it an assumption in notes + `not_claimed`; state in the
  narrative the rate at which the default configuration breaks even.
- **Unsourced productivity assumptions** (hours per visit, visits per day) must be labeled
  "operator estimate — verify locally", with a sensitivity paragraph showing the result at a worse value.
- **Private-pay benchmarks:** say what the survey measures (e.g. CareScout = private one-bedroom in an AL
  community) and caveat it when applied to small residential homes.
- **Mandatory vendors/equipment** the rules require (survey vendors like HHCAHPS, AEDs above a bed count,
  generators, EVV) need a cost line even when the price is an operator estimate.
- Every URL must actually contain the claim. Do not cite a news article that 404s; cite the primary source.

## Optional fields the generators support

- `configurations[].ramp`: `{start_clients, add_per_month, note}` — overrides the bundle ramp (larger homes
  admit more per month).
- `startup_costs[].category`: `"working_capital"` (advisory reserve, replaced in totals by the modeled ramp-up
  deficit) or `"required_reserve"` (cash the rules require you to show).
- `startup_costs[].min_capacity`: only applies to configurations at or above this capacity (e.g. AED at 17+).
- Startup `low`/`high` ranges are scaled by configuration size (smallest config → low, largest → high).

Notes on the financial model
- `rate × units_per_client_month × share_of_clients` summed over lines = revenue per client per month.
  Use `share_of_clients` for payer mix (e.g. 0.7 private pay at $5,500 + 0.3 ALW at $95.69 × 30.42).
- `basis` for staffing: `hours_per_month` (fixed coverage, e.g. 24/7 one awake = 730),
  `hours_per_client_month` (scales with census), or `annual_salary`.
- Opex `per_client` lines scale with census; `fixed` don't. Include rent/mortgage, insurance at the
  state's required minimums, utilities, food, supplies, vehicle, software/EVV, licensing renewal
  (annual fee ÷ 12), accounting/legal, marketing, training, maintenance.
- Provide 3–6 configurations spanning small → larger and different payer mixes. At least one should
  be the configuration an expert operator would actually choose to be profitable in this state.

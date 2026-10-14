You are researching one Care Licensing Solutions bundle: **{STATE} — {PROGRAM}** (the state may call
this license type "{STATE_TERMS}"). Customers are people starting this kind of care business in
{STATE}; they rely on what you find to get licensed and to model profit. Accuracy beats volume.

Read first (all local files):
- /home/claude/carelicensingsolutionsclaude/content-factory/SCHEMA.md — the exact JSON you must produce and the rules. Follow it strictly.
- /home/claude/carelicensingsolutionsclaude/content-factory/reference/oklahoma/OK_market_research.txt — the quality bar for the report (structure, tone, "verified numbers only", "what this report does not claim").
- The Oklahoma P&L and checklist in the same folder (open with python/openpyxl) to see the depth expected.

Tools: WebSearch and WebFetch for research. Google Drive is READ-ONLY for you (load with ToolSearch
"select:mcp__Google_Drive__search_files,mcp__Google_Drive__read_file_content"); never create, edit,
move, share or delete Drive files. The previous (unreliable) versions of this bundle's files are:
{OLD_FILES}
Read them only to (a) reuse any checklist steps you can VERIFY and (b) list what they got wrong in
`corrections_vs_previous`.

Method:
1. Identify the exact license/certification type(s), regulator(s), governing statute and admin code
   for {PROGRAM} in {STATE}. Fetch the actual rule text pages for fees, staffing, training, capacity.
2. Find how operators get paid: Medicaid (FFS fee schedule or managed care), Medicare, waivers,
   private pay, state programs. Pull current published rates with codes and effective dates.
3. Demand: waitlists, enrollment, demographics, referral sources — sourced only.
4. Workforce: BLS OEWS May 2025 state wages for the actual roles; state minimum wage 2026.
5. Costs: insurance minimums from rule, licensing fees/renewals, required systems (EVV etc.),
   realistic rent for the facility size in this state (cite a source such as a rent survey or
   listing aggregate; if not citable, mark the opex note "operator estimate — verify locally").
6. Build 3–6 financial configurations that a seasoned operator would consider, meeting the state's
   real staffing rules, and make sure at least one is genuinely profitable at default occupancy with
   real rates and full required costs. If none can be profitable, say so plainly in the narrative and
   show what price/size would be required.
7. Write the 10 narrative sections (markdown, inline [S#] cites), the 40–110 item phased checklist with
   citations, contacts, and the key numbers table.

Write the result as valid JSON (no comments) with the Write tool to:
/home/claude/carelicensingsolutionsclaude/content-factory/research/{SLUG}.json
Validate it parses: `python3 -c "import json;json.load(open('<path>'))"`.

Reply with a short summary: number of sources (official vs secondary), the configurations and which
you expect to be profitable, anything you could not verify, and the top 3 corrections vs the old files.

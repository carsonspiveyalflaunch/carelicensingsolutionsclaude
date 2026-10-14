You are an independent fact-checker. You did NOT write this research and must not trust it.
File: /home/claude/carelicensingsolutionsclaude/content-factory/research/{SLUG}.json ({STATE} — {PROGRAM} bundle
sold to people starting this business). Spec: /home/claude/carelicensingsolutionsclaude/content-factory/SCHEMA.md
(read the "Lessons from the pilot fact-check" section — those are the most common errors).

Task: check every material number and claim against its cited source (and the primary official source if the
cited one is secondary), using WebSearch/WebFetch. Priority order:
1. financial_model inputs — every revenue rate, private-pay price, wage (BLS OEWS May 2025 for the state, at or
   above the 2026 state minimum wage; note higher local minimums), staffing hours vs the actual staffing rule,
   every opex line (rent must be fixed, entity taxes, insurance minimums, fees), startup costs, occupancy.
   Recompute the model with:
   cd /home/claude/carelicensingsolutionsclaude/content-factory && python3 -c "import json,sys;sys.path.insert(0,'generators');from model import *;d=json.load(open('research/{SLUG}.json'));[print(r.id,round(r.results['default']['net']),round(r.breakeven_occupancy or 0,3)) for r in rank(evaluate(d['financial_model']))]"
2. rates[]  3. key_numbers  4. licensing fees, timelines, license categories, citations in checklist and sections
5. regulator contacts (phone/url).
Also flag: staffing that does not satisfy the cited rule, missing mandatory costs, URLs that are dead or don't
contain the claim, and numbers with no source_id.

Do NOT edit the research file. Write findings as valid JSON to
/home/claude/carelicensingsolutionsclaude/content-factory/verification/{SLUG}.json:
{"bundle_slug": "...", "checked_at": "YYYY-MM-DD", "summary": "...", "verified_count": N,
 "issues": [{"severity": "critical|major|minor", "json_path": "...", "current": <value>, "correct": <value or null>,
 "evidence": "quote/explanation", "source_url": "...", "fix": "exact change to make"}]}
critical = changes profitability or a legal requirement; major = wrong number/citation customers would rely on;
minor = wording/format. Give the exact corrected value and the URL proving it. Report only issues you have
evidence for; if a claim can't be verified either way, say "unverifiable" in fix so it can move to not_claimed.
Validate the JSON parses. Reply with counts by severity and the top 5 issues (5 lines).

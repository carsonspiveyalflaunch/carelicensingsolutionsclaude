Apply fact-check corrections to a research JSON.
- Research (edit this): /home/claude/carelicensingsolutionsclaude/content-factory/research/{SLUG}.json
- Findings: /home/claude/carelicensingsolutionsclaude/content-factory/verification/{SLUG}.json
- Spec: /home/claude/carelicensingsolutionsclaude/content-factory/SCHEMA.md
- Model code: /home/claude/carelicensingsolutionsclaude/content-factory/generators/model.py

Rules:
1. Apply every critical/major/minor fix that has evidence. Edit with Python (json load → modify → json.dump
   indent=2, ensure_ascii=False); never retype the file by hand.
2. Unverifiable claims: remove from customer text and add a line to not_claimed (or keep a number only if it
   is clearly labeled an assumption, with a sensitivity in the narrative).
3. Fix narrative text (sections, checklist, key_numbers) wherever the same wrong number appears.
4. Never raise rates or remove required costs to improve profit. No number without a source_id; operator
   estimates say "operator estimate — verify locally".
5. If after honest fixes no configuration is profitable at default occupancy, do not fudge. You may add one
   realistic configuration an expert operator would choose only if its inputs are sourced (max 6 configs);
   otherwise state plainly what size/price/payer mix profit requires.
6. Keep any narrative results tables consistent with the model (recompute).
7. Append entries to top-level "verification_log": [{"issue": "...", "change": "..."}].
8. Validate JSON parses and run:
   cd /home/claude/carelicensingsolutionsclaude/content-factory && python3 -c "import json,sys;sys.path.insert(0,'generators');from model import *;d=json.load(open('research/{SLUG}.json'));[print(r.id,round(r.results['default']['net']),round(r.breakeven_occupancy or 0,3)) for r in rank(evaluate(d['financial_model']))]"
   then build: python3 generators/build.py research/{SLUG}.json
Reply with: fixes applied, any skipped and why, and the net/month per configuration.

"""Policy & Procedure Manual pipeline (Anthropic API).

Per bundle:
  M1 Requirements map — Sonnet + web_fetch: verify the state rule sections a manual must cover, choose the
     program's policy set, attach exact citations and state specifics (ratios, deadlines, hotlines, forms).
  M2 Write           — Sonnet, 6 policies per call, citing ONLY verified citation ids.
  M3 Check & fix     — code rejects placeholders, unverified cites, wrong federal rules; Sonnet rewrites flagged policies.
  Render             — DOCX (editable) + PDF.
Spend is shared with run.py (status/spend.json, BUDGET_USD cap).

Usage: python3 content-factory/pipeline/manuals.py --slugs a,b [--workers 3]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import run  # noqa: E402  (shares client, budget guard, logging)
from run import CF, SONNET, WEB_FETCH, WEB_SEARCH, BudgetExceeded, call_json, log  # noqa: E402

sys.path.insert(0, str(CF / "generators"))
from manual_docx import build_manual  # noqa: E402

POLICY_SETS = {
    "al": {
        "Governance and Administration": ["Organization, Governing Body and Administrator Responsibilities",
                                          "Licensure, Posting and Regulatory Compliance", "Policy Review and Document Control",
                                          "Quality Assurance and Performance Improvement", "Corporate Compliance, Fraud and Billing Integrity"],
        "Resident Rights": ["Resident Rights and Responsibilities", "Grievances and Complaints", "Ombudsman Access",
                            "Admission Agreement, Fees, Deposits and Refunds", "Resident Funds and Personal Property",
                            "Advance Directives", "Privacy, Confidentiality and HIPAA", "Nondiscrimination and Language Access"],
        "Admission, Retention and Discharge": ["Pre-Admission Screening and Admission Criteria", "Resident Assessment and Reassessment",
                                               "Service / Care Plan", "Retention Limits and Conditions the Facility Cannot Serve",
                                               "Discharge, Transfer and Relocation Notice"],
        "Health and Care Services": ["Medication Management, Storage and Disposal", "Medication Administration and Staff Authorization",
                                     "Nursing Services and Delegation", "Change of Condition, Physician Notification and Hospital Transfer",
                                     "Dementia and Memory Care", "Falls Prevention", "Skin Integrity", "Hospice and Home Health Coordination",
                                     "Death of a Resident"],
        "Safety and Protection": ["Abuse, Neglect and Exploitation Prevention and Reporting", "Incident and Accident Reporting",
                                  "Elopement and Missing Resident", "Restraints and Restrictive Practices",
                                  "Emergency Preparedness and Disaster Plan", "Fire Safety, Evacuation and Drills",
                                  "Infection Prevention and Control", "Smoking, Visitors and Pets"],
        "Daily Living": ["Food Service and Therapeutic Diets", "Activities and Social Programming", "Housekeeping, Laundry and Maintenance",
                         "Transportation"],
        "Staffing and Personnel": ["Staffing Levels and Supervision", "Background Checks and Employee Registries",
                                   "Hiring, Orientation and Ongoing Training", "Employee Health and TB Screening",
                                   "Personnel Records", "Staff Conduct and Professional Boundaries"],
        "Records": ["Resident Records and Retention", "Required Reports to the State"],
    },
    "phc": {
        "Governance and Administration": ["Organization, Governing Body and Administrator Responsibilities",
                                          "Licensure, Service Area and Advertising Requirements", "Policy Review and Document Control",
                                          "Quality Assurance and Performance Improvement", "Corporate Compliance, Fraud and Billing Integrity"],
        "Client Rights": ["Client Rights and Responsibilities", "Grievances and Complaints", "Privacy, Confidentiality and HIPAA",
                          "Client Property, Gifts and Financial Exploitation Prevention", "Nondiscrimination and Language Access",
                          "Service Agreement, Rates and Billing Disclosure"],
        "Services": ["Scope of Services — What Caregivers May and May Not Do", "Client Intake, Eligibility and Assessment",
                     "Service Plan and Plan Updates", "Supervision of Caregivers and Supervisory Visits",
                     "Medication Assistance and Self-Administration Support", "Scheduling, Missed Visits and Continuity of Care",
                     "Electronic Visit Verification and Timekeeping", "Change in Client Condition and Emergencies in the Home",
                     "Discharge, Transfer and Discontinuation of Services", "Coordination with Medicaid Programs and Payers"],
        "Safety and Protection": ["Abuse, Neglect and Exploitation Prevention and Reporting", "Incident Reporting",
                                  "Infection Prevention and Control", "Client Emergency and Disaster Plans",
                                  "Caregiver Safety in the Home and Workplace Violence", "Transporting Clients"],
        "Personnel": ["Caregiver Qualifications, Registry and Certification", "Background Checks and Employee Registries",
                      "Orientation, Competency Evaluation and Annual Training", "Employee Health and TB Screening",
                      "Personnel Records", "Wage, Hour and Overtime Compliance", "Staff Conduct and Professional Boundaries"],
        "Records": ["Client Records and Retention", "Required Reports to the State"],
    },
    "dd": {
        "Governance and Administration": ["Organization, Governing Body and Program Director Responsibilities",
                                          "Licensure, Certification and Provider Agreements", "Policy Review and Document Control",
                                          "Quality Improvement, Data Review and Mortality Review",
                                          "Medicaid Compliance, Billing and Service Documentation"],
        "Individual Rights": ["Individual Rights and HCBS Settings Requirements", "Rights Restrictions and Due Process",
                              "Grievances and Complaints", "Privacy, Confidentiality and HIPAA",
                              "Personal Funds and Property Management", "Informed Consent and Decision-Making Support",
                              "Nondiscrimination and Communication Access"],
        "Person-Centered Services": ["Referral, Admission and Transition In", "Person-Centered Planning and the Individual Plan",
                                     "Implementation of Supports and Daily Documentation", "Community Integration and Employment Choice",
                                     "Transition, Discharge and Termination of Services"],
        "Health and Wellness": ["Medication Administration and Staff Certification", "Nursing Oversight and Health Care Coordination",
                                "Health Monitoring, Seizures and Choking Risk", "Change of Condition and Emergency Medical Care",
                                "Death of an Individual"],
        "Behavior Support and Protection": ["Positive Behavior Support", "Restrictive Interventions, Restraint and Seclusion",
                                            "Abuse, Neglect and Exploitation Prevention and Reporting",
                                            "Reportable Incidents and Investigations", "Missing Person and Elopement"],
        "Home Environment and Safety": ["Residential Environment and Accessibility", "Emergency Preparedness and Fire Drills",
                                        "Infection Prevention and Control", "Food, Nutrition and Modified Diets", "Transportation and Vehicle Safety"],
        "Staffing and Personnel": ["Staffing Ratios, Supervision and Awake Overnight Staff", "Background Checks and Employee Registries",
                                   "Direct Support Professional Orientation and Training", "Employee Health and TB Screening",
                                   "Personnel Records", "Staff Conduct and Professional Boundaries"],
        "Records": ["Individual Records and Retention", "Required Reports to the State"],
    },
}

FORBIDDEN = [r"X{3,}", r"example\.com", r"\bTBD\b", r"lorem", r"\[insert", r"Form LIC-X", r"42 CFR (Part )?484"]


def program_key(program: str) -> str:
    p = program.lower()
    if "assisted" in p:
        return "al"
    if "home care" in p or "personal" in p:
        return "phc"
    if "dd" in p or "residential care" in p:
        return "dd"
    raise ValueError(f"no policy set for {program}")


def research_context(d: dict) -> dict:
    return {
        "state": d["state"], "program": d["program"], "state_program_name": d["state_program_name"],
        "regulators": d.get("regulators"), "regulations": d.get("regulations"),
        "key_numbers": d.get("key_numbers"), "sources": [{k: s.get(k) for k in ("id", "title", "url")} for s in d["sources"]],
        "checklist": [{"task": c["task"], "instructions": c.get("instructions", "")[:400], "cite": c.get("cite")}
                      for c in d.get("checklist", [])],
        "operations": d.get("sections", {}).get("operations", "")[:6000],
        "licensing_pathway": d.get("sections", {}).get("licensing_pathway", "")[:4000],
        "staffing_rules": [{"cfg": c["label"], "staffing": [{k: s.get(k) for k in ("role", "cite", "notes")}
                                                            for s in c.get("staffing", [])]}
                           for c in d["financial_model"]["configurations"][:2]],
    }


REQ_SYSTEM = """You build the requirements map for a state-specific Policy & Procedure Manual for a licensed care
business. Accuracy is critical: surveyors will check every citation. Rules:
- Use exact section numbers. Every citation you output must be either (a) verified by fetching the rule text now, or
  (b) present in the fact-checked research provided. Mark verified=true only for those. Never invent section numbers.
- Prefer the state's administrative code / statute / official provider manual for this exact program.
- Federal rules only where they truly apply (HIPAA 45 CFR 160/164, OSHA 29 CFR 1910.1030, ADA, Title VI, HCBS settings
  42 CFR 441.301(c)/441.710 for Medicaid HCBS, EVV 42 USC 1396b(l), FLSA 29 CFR 552 for home care). Never cite
  42 CFR 484 (home health CoPs) unless the program is a Medicare home health agency.
Return ONLY JSON:
{"citations":[{"id":"C1","cite":"exact cite","title":"section title","url":"...","requirement":"what it requires (concrete)","verified":true}],
 "policies":[{"id":"ABC-01","category":"...","title":"...","citations":["C1"],"federal":["45 CFR 164.530"],
   "state_specifics":["concrete facts to include: ratios, hours, deadlines, hotline numbers, form numbers, who may do what"]}],
 "forms":[{"name":"...","purpose":"...","policy_ids":["ABC-01"]}]}
Use the given policy set as the base (keep its categories); add any policy the state rules require that is missing,
drop any that does not apply to this program in this state, and rename to the state's terms. 40-55 policies total."""


OFFICIAL_SYSTEM = """You find the OFFICIAL document(s) a state uses to review a new provider's policies and procedures
for this exact license/program — e.g., a policy checklist form (Maryland DH Form DD.APP.1.1 for COMAR 10.22.02.10),
application instructions that list required plan-of-operation components (California LIC 281 Section B), a
regulation section that enumerates required written policies, or a provider manual/application packet checklist.
Search the regulator's website and fetch the current version. Then list EVERY required item exactly as the document
states it (keep the document's own item numbering, e.g., "A(7)" or "B9"). Never invent items; if no single document
exists, use the regulation sections that list required written policies/plan of operation and say so.
Return ONLY JSON: {"documents":[{"title","form_number","issuer","version","url","how_used"}],
"required_items":[{"item_id","text","cite","doc":0}],
"structure":{"use_as_categories":true|false,"sections":["section names in the document's order"]},
"notes":"how the reviewer expects the manual to be organized or submitted"}"""


def official_requirements(item: dict, d: dict) -> dict:
    seeds = []
    idx_path = CF / "reference" / "requirements" / "index.json"
    if idx_path.exists():
        for doc in json.loads(idx_path.read_text()).get(item["slug"], []):
            txt = (CF / "reference" / "requirements" / doc["file"]).read_text(errors="ignore")
            seeds.append({**{k: v for k, v in doc.items() if k != "file"}, "text": txt[:30000]})
    user = (f"State: {d['state']}\nProgram: {d['program']} — state name: {d['state_program_name']}\n"
            f"Regulators: {json.dumps(d.get('regulators'), ensure_ascii=False)}\n"
            f"Regulations: {json.dumps(d.get('regulations'), ensure_ascii=False)}\n")
    if seeds:
        user += ("\nThe business owner supplied these official documents (verified authentic). Use them; check online "
                 "whether a newer version exists and use the newer one if so:\n" + json.dumps(seeds, ensure_ascii=False))
    tools = [{**WEB_SEARCH, "max_uses": 6}, {**WEB_FETCH, "max_uses": 8, "max_content_tokens": 8000}]
    return call_json(item["slug"], "M0:official", SONNET, OFFICIAL_SYSTEM, user, tools=tools, max_tokens=24000)


def requirements(item: dict, d: dict, citations: list | None = None, official: dict | None = None) -> dict:
    """M1a: verify citations (with tools). M1b: plan the policy set from them (no tools)."""
    ps = POLICY_SETS[program_key(d["program"])]
    ctx = (f"State: {d['state']}\nProgram: {d['program']} — state name: {d['state_program_name']}\n\n"
           f"BASE POLICY SET:\n{json.dumps(ps)}\n\nFACT-CHECKED RESEARCH (citations here are verified):\n"
           f"{json.dumps(research_context(d), ensure_ascii=False)}\n")
    if not citations:
        tools = [{**WEB_FETCH, "max_uses": 14, "max_content_tokens": 6000}, {**WEB_SEARCH, "max_uses": 5}]
        c = call_json(item["slug"], "M1a:citations", SONNET, REQ_SYSTEM, ctx +
                      "\nSTEP 1 ONLY: fetch the governing rule text (table of contents and the sections on required "
                      "policies, staffing, training, medication, incident/abuse reporting, rights, records, emergency "
                      "preparedness) and return ONLY {\"citations\": [...]} — 25-60 entries, each requirement under "
                      "250 characters.", tools=tools, max_tokens=40000)
        citations = c.get("citations", [])
    official = official or {}
    items = official.get("required_items", [])
    plan_prompt = (ctx + "\nVERIFIED CITATIONS (use these ids only):\n" + json.dumps(citations, ensure_ascii=False) +
                   "\n\nOFFICIAL REQUIRED ITEMS the state reviewer checks (every item must be covered):\n" +
                   json.dumps(items, ensure_ascii=False) + "\nOfficial structure: " +
                   json.dumps(official.get("structure", {}), ensure_ascii=False) +
                   "\n\nSTEP 2 ONLY: return ONLY {\"policies\": [...], \"forms\": [...]} with 42-55 policies "
                   "(id, category, title, covers (list of official item_ids this policy satisfies), citations, federal, "
                   "state_specifics with at most 5 short items). Every official item_id must appear in at least one "
                   "policy's covers. If the official structure says use_as_categories, use its sections as the "
                   "categories in that order (then add other categories after). Policy ids use a short prefix per "
                   "category (e.g., GOV-01, RR-03).")
    plan = call_json(item["slug"], "M1b:plan", SONNET, REQ_SYSTEM, plan_prompt, max_tokens=40000)
    pols = [p for p in plan.get("policies", []) if isinstance(p, dict) and p.get("id") and p.get("title")]
    if len(pols) < 40:
        plan = call_json(item["slug"], "M1b:plan-retry", SONNET, REQ_SYSTEM, plan_prompt +
                         f"\nYour previous answer had only {len(pols)} complete policies. Return all 42-55, keeping "
                         "each entry compact.", max_tokens=40000)
        pols = [p for p in plan.get("policies", []) if isinstance(p, dict) and p.get("id") and p.get("title")]
    if len(pols) < 35:
        raise ValueError(f"policy plan too short ({len(pols)})")
    for p in pols:
        p.setdefault("category", "General")
        p["covers"] = [c for c in p.get("covers", []) if isinstance(c, str)]
    covered = {c for p in pols for c in p["covers"]}
    gaps = [it for it in items if it.get("item_id") and it["item_id"] not in covered]
    for n, it in enumerate(gaps, 1):  # never leave an official item uncovered
        pols.append({"id": f"REQ-{n:02d}", "category": "Additional State Requirements",
                     "title": (it.get("text") or it["item_id"])[:90], "covers": [it["item_id"]],
                     "citations": [], "federal": [], "state_specifics": [it.get("text", "")]})
    return {"citations": citations, "policies": pols, "forms": plan.get("forms", []), "official": official,
            "plan_version": 2}


WRITE_SYSTEM = """You write policies for a state-specific Policy & Procedure Manual that a new licensed care business
will adopt and a state surveyor will review. Write as the agency ("[AGENCY NAME]"), in plain professional English.
Each policy must be specific to the state and program: use the state specifics provided (ratios, hours, deadlines,
hotlines, forms, who may perform tasks). Cite ONLY the citation ids provided for that policy (by id); do not write
section numbers that are not in the provided citation list. Use placeholders only in square brackets for
agency-specific facts ([ADMINISTRATOR NAME], [PHONE], [ADDRESS]); never leave template junk (XXXX, TBD).
Procedures: 10-20 numbered, concrete steps (who does what, by when, where it is documented).
Each policy lists "official_items" — items on the state's official policy checklist/application form. Address every
one explicitly and name it in the Policy section (e.g., "This policy meets COMAR 10.22.02.10 A(5)" or "LIC 281
item B9 — Admission Policies"), so the reviewer can tick it off. Keep "covers" exactly as given.
Return ONLY JSON: {"policies":[{"id","category","title","applies_to","citations":["C1"],"federal":["..."],
"covers":["item ids"],"purpose","policy","definitions":[{"term","definition"}],"procedures":["..."],"responsibilities":[{"role","duty"}],
"documentation":["..."],"related":["IDS"]}]}"""


def write_policies(item: dict, d: dict, req: dict, batch: list[dict], extra: str = "") -> list[dict]:
    items = {it.get("item_id"): it for it in (req.get("official") or {}).get("required_items", [])}
    batch = [dict(p, official_items=[items[c] for c in p.get("covers", []) if c in items]) for p in batch]
    cite_ids = {c for p in batch for c in p.get("citations", [])}
    cites = [c for c in req["citations"] if c["id"] in cite_ids]
    user = (f"State: {d['state']} — {d['state_program_name']}\nAll policy ids/titles in this manual (for 'related'):\n"
            + json.dumps([[p["id"], p["title"]] for p in req["policies"]]) +
            "\n\nCITATIONS available for this batch:\n" + json.dumps(cites, ensure_ascii=False) +
            "\n\nKEY FACTS (fact-checked):\n" + json.dumps({"regulators": d.get("regulators"),
                                                             "key_numbers": d.get("key_numbers")}, ensure_ascii=False) +
            "\n\nWRITE THESE POLICIES:\n" + json.dumps(batch, ensure_ascii=False) + extra)
    out = call_json(item["slug"], "M2:write", SONNET, WRITE_SYSTEM, user, max_tokens=40000)
    return out.get("policies", [])


def problems_in(pol: dict, valid_cites: set, allow_484: bool) -> list[str]:
    probs = []
    blob = json.dumps(pol, ensure_ascii=False)
    for pat in FORBIDDEN:
        if pat.startswith("42 CFR") and allow_484:
            continue
        if re.search(pat, blob, re.I):
            probs.append(f"contains forbidden pattern {pat}")
    bad = [c for c in pol.get("citations", []) if c not in valid_cites]
    if bad:
        probs.append(f"unknown citation ids {bad}")
    if len(pol.get("procedures", [])) < 6:
        probs.append("fewer than 6 procedure steps")
    for k in ("purpose", "policy"):
        if len((pol.get(k) or "").strip()) < 60:
            probs.append(f"{k} too short")
    return probs


FRONT_SYSTEM = """Write the front matter of a state-specific Policy & Procedure Manual. Return ONLY JSON:
{"purpose": markdown, "how_to_use": markdown, "regulatory_framework": markdown}. regulatory_framework lists the
governing rules (from the citations given, by their exact cite text) and the regulators with contact info, and names
the official policy checklist / application document(s) the state uses to review this manual, explaining that
Appendix A maps every official item to the policy that satisfies it. Do not
invent rules. Mention that the manual must be customized ([AGENCY NAME] placeholders), adopted by the governing
body, kept current, and that staff must be trained on it."""


def process(item: dict) -> dict:
    slug = item["slug"]
    out_json = CF / "manuals" / f"{slug}.json"
    if out_json.exists():
        return {"slug": slug, "status": "skipped (exists)"}
    d = json.loads((CF / "research" / f"{slug}.json").read_text())
    work = CF / "pipeline" / "work" / f"{slug}.manual-req.json"
    req = json.loads(work.read_text()) if work.exists() else {}
    good = [p for p in req.get("policies", []) if isinstance(p, dict) and p.get("id") and p.get("title")]
    if len(good) < 40 or req.get("plan_version", 1) < 2:
        off_path = CF / "pipeline" / "work" / f"{slug}.official.json"
        if off_path.exists():
            official = json.loads(off_path.read_text())
        else:
            official = official_requirements(item, d)
            off_path.parent.mkdir(parents=True, exist_ok=True)
            off_path.write_text(json.dumps(official, indent=2, ensure_ascii=False))
        req = requirements(item, d, citations=req.get("citations") or None, official=official)
        work.parent.mkdir(parents=True, exist_ok=True)
        work.write_text(json.dumps(req, indent=2, ensure_ascii=False))
    req["citations"] = [c for c in req.get("citations", []) if c.get("verified") and c.get("cite")]
    valid = {c["id"] for c in req["citations"]}
    for p in req["policies"]:
        p["citations"] = [c for c in p.get("citations", []) if c in valid]
    allow_484 = "home health" in d["program"].lower()

    written: list[dict] = []
    batches = [req["policies"][i:i + 6] for i in range(0, len(req["policies"]), 6)]
    with ThreadPoolExecutor(max_workers=3) as ex:
        for res in ex.map(lambda b: write_policies(item, d, req, b), batches):
            written += res
    by_id = {p["id"]: p for p in written}
    # keep requirement order and fill anything the model skipped
    ordered = []
    missing = []
    for p in req["policies"]:
        if p["id"] in by_id:
            w = by_id[p["id"]]
            w.setdefault("category", p["category"])
            w["covers"] = p.get("covers", [])
            ordered.append(w)
        else:
            missing.append(p)
    if missing:
        ordered += write_policies(item, d, req, missing)

    flagged = {p["id"]: problems_in(p, valid, allow_484) for p in ordered}
    flagged = {k: v for k, v in flagged.items() if v}
    if flagged:
        log({"slug": slug, "stage": "M3:flagged", "count": len(flagged)})
        redo = [dict(next(r for r in req["policies"] if r["id"] == k), problems=v) for k, v in flagged.items()
                if any(r["id"] == k for r in req["policies"])]
        for i in range(0, len(redo), 6):
            fixed = write_policies(item, d, req, redo[i:i + 6],
                                   extra="\n\nThese were rejected for the listed 'problems'; rewrite them fully and fix every problem.")
            for f in fixed:
                for j, p in enumerate(ordered):
                    if p["id"] == f.get("id"):
                        ordered[j] = f
    if len(ordered) < 0.9 * len(req["policies"]):
        raise ValueError(f"only {len(ordered)} of {len(req['policies'])} policies written")
    still = {p["id"]: problems_in(p, valid, allow_484) for p in ordered}
    still = {k: v for k, v in still.items() if v}

    front = call_json(slug, "M4:front", SONNET, FRONT_SYSTEM,
                      json.dumps({"state": d["state"], "program": d["state_program_name"], "citations": req["citations"],
                                  "official_documents": (req.get("official") or {}).get("documents"),
                                  "official_notes": (req.get("official") or {}).get("notes"),
                                  "regulators": d.get("regulators")}, ensure_ascii=False), max_tokens=8000)
    manual = {"bundle_slug": slug, "state": d["state"], "program": d["program"],
              "state_program_name": d["state_program_name"], "as_of": time.strftime("%Y-%m"),
              "front_matter": front, "citations": req["citations"], "policies": ordered,
              "forms": req.get("forms", []), "unresolved_checks": still,
              "official": req.get("official") or {}}
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(manual, indent=2, ensure_ascii=False))
    outdir = CF / "output" / slug
    outdir.mkdir(parents=True, exist_ok=True)
    build_manual(manual, str(outdir / f"{d['state']} {d['program']} - Policy and Procedure Manual.docx"))
    return {"slug": slug, "status": "done", "usd": run.SPEND["by_bundle"].get(slug, 0), "policies": len(ordered),
            "citations": len(req["citations"]), "unresolved": len(still)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs", default="")
    ap.add_argument("--workers", type=int, default=3)
    a = ap.parse_args()
    if a.slugs:
        slugs = [s.strip() for s in a.slugs.split(",") if s.strip()]
    else:
        slugs = sorted(p.stem for p in (CF / "research").glob("*.json") if "home-health" not in p.stem)
    slugs = [s for s in slugs if not (CF / "manuals" / f"{s}.json").exists()]
    log({"stage": "manuals:start", "bundles": slugs, "spent_so_far": run.SPEND["total_usd"]})
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = {ex.submit(process, {"slug": s}): s for s in slugs}
        for f in as_completed(futs):
            s = futs[f]
            try:
                r = f.result()
            except BudgetExceeded as e:
                r = {"slug": s, "status": f"stopped: {e}"}
            except Exception as e:
                r = {"slug": s, "status": f"error: {e}", "trace": traceback.format_exc()[-800:]}
            log({"stage": "manual", **r})
    log({"stage": "manuals:end", "spent_total": run.SPEND["total_usd"]})


if __name__ == "__main__":
    main()

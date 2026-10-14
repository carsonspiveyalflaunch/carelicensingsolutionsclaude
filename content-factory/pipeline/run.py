"""Low-cost bundle pipeline (Anthropic API).

Stages per bundle (each a fresh, short API call so context stays small):
  A. Gather facts  — Haiku + web_search/web_fetch, 4 topic calls, returns facts with quotes + URLs.
  B. Assemble      — Sonnet, no tools: facts -> research JSON (financial model first, then narrative).
  C. Code checks   — schema, sources, model math (free).
  D. Verify        — Sonnet + web_fetch on cited URLs for the numbers that drive profit and legality.
  E. Fix           — Sonnet returns JSON patches; applied by code; files rebuilt.

A hard budget guard (cumulative across runs, in content-factory/status/spend.json) stops new API calls
once BUDGET_USD is reached.

Usage: python3 content-factory/pipeline/run.py [--slugs a,b] [--limit N] [--workers 4]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import anthropic

CF = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CF / "generators"))
from model import evaluate, outlook, rank  # noqa: E402

HAIKU = os.environ.get("CF_FACT_MODEL", "claude-haiku-5-5")
SONNET = os.environ.get("CF_MAIN_MODEL", "claude-sonnet-5-5")
# USD per million tokens: input, output, cache read, cache write (1.25x input)
PRICES = {
    "claude-haiku-5-5": (0.10, 0.50, 0.01, 0.125),
    "claude-sonnet-5-5": (2.0, 10.0, 0.10, 2.5),
    "claude-opus-5-5": (4.0, 20.0, 0.20, 5.0),
}
SEARCH_USD = 0.01
BUDGET = float(os.environ.get("BUDGET_USD", "280"))
SPEND_FILE = CF / "status" / "spend.json"
LOG_FILE = CF / "status" / "pipeline-log.jsonl"
WEB_SEARCH = {"type": "web_search_20250305", "name": "web_search"}
WEB_FETCH = {"type": "web_fetch_20250910", "name": "web_fetch"}

client = anthropic.Anthropic(max_retries=6)
_lock = threading.Lock()


class BudgetExceeded(Exception):
    pass


# ---------------------------------------------------------------- spend tracking
def load_spend() -> dict:
    try:
        return json.loads(SPEND_FILE.read_text())
    except Exception:
        return {"total_usd": 0.0, "by_bundle": {}}


SPEND = load_spend()


def charge(slug: str, usd: float) -> None:
    with _lock:
        SPEND["total_usd"] = round(SPEND["total_usd"] + usd, 4)
        SPEND["by_bundle"][slug] = round(SPEND["by_bundle"].get(slug, 0.0) + usd, 4)
        SPEND_FILE.parent.mkdir(parents=True, exist_ok=True)
        SPEND_FILE.write_text(json.dumps(SPEND, indent=2))


def guard() -> None:
    if SPEND["total_usd"] >= BUDGET:
        raise BudgetExceeded(f"budget ${BUDGET} reached (spent ${SPEND['total_usd']:.2f})")


def log(event: dict) -> None:
    with _lock:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with LOG_FILE.open("a") as f:
            f.write(json.dumps({"t": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), **event}) + "\n")
    print(json.dumps(event), flush=True)


def cost_of(model: str, usage) -> float:
    pin, pout, pcr, pcw = PRICES.get(model, PRICES["claude-sonnet-5-5"])
    u = usage
    usd = (getattr(u, "input_tokens", 0) or 0) * pin + (getattr(u, "output_tokens", 0) or 0) * pout
    usd += (getattr(u, "cache_read_input_tokens", 0) or 0) * pcr
    usd += (getattr(u, "cache_creation_input_tokens", 0) or 0) * pcw
    usd /= 1e6
    stu = getattr(u, "server_tool_use", None)
    if stu is not None:
        usd += (getattr(stu, "web_search_requests", 0) or 0) * SEARCH_USD
    return usd


# ---------------------------------------------------------------- API call
def call(slug: str, stage: str, model: str, system: str, user: str, tools=None, max_tokens=16000) -> str:
    """One request (continuing through pause_turn). Returns the final text."""
    guard()
    messages = [{"role": "user", "content": user}]
    sys_blocks = [{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}]
    total = 0.0
    text_parts: list[str] = []
    for _ in range(8):
        kwargs = dict(model=model, max_tokens=max_tokens, system=sys_blocks, messages=messages)
        if tools:
            kwargs["tools"] = tools
        with client.messages.stream(**kwargs) as s:
            msg = s.get_final_message()
        usd = cost_of(model, msg.usage)
        total += usd
        charge(slug, usd)
        text_parts = [b.text for b in msg.content if getattr(b, "type", "") == "text"]
        if msg.stop_reason == "pause_turn":
            messages = [messages[0], {"role": "assistant", "content": msg.content}]
            continue
        break
    log({"slug": slug, "stage": stage, "model": model, "usd": round(total, 4), "stop": msg.stop_reason})
    return "\n".join(text_parts)


def parse_json(text: str):
    t = text.strip()
    m = re.search(r"```(?:json)?\s*(.*?)(?:```|$)", t, re.S)
    if m and m.group(1).strip():
        t = m.group(1)
    start = min([i for i in (t.find("{"), t.find("[")) if i != -1], default=-1)
    if start == -1:
        raise ValueError("no JSON in response")
    t = t[start:]
    end = max(t.rfind("}"), t.rfind("]"))
    try:
        return json.loads(t[: end + 1], strict=False)
    except json.JSONDecodeError:
        return json.loads(_repair(t), strict=False)


def _repair(t: str) -> str:
    """Close a truncated JSON document: drop the incomplete tail and balance brackets."""
    stack, out, in_str, esc, last_ok = [], [], False, False, 0
    for i, ch in enumerate(t):
        out.append(ch)
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch in "{[":
            stack.append("}" if ch == "{" else "]")
        elif ch in "}]":
            if stack:
                stack.pop()
            last_ok = i + 1
        elif ch == "," and stack:
            last_ok = i
    body = t[:last_ok].rstrip().rstrip(",")
    # recompute open brackets for the kept prefix
    stack, in_str, esc = [], False, False
    for ch in body:
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch in "{[":
            stack.append("}" if ch == "{" else "]")
        elif ch in "}]" and stack:
            stack.pop()
    return body + "".join(reversed(stack))


# ---------------------------------------------------------------- shared context
SCHEMA = (CF / "SCHEMA.md").read_text()
EXAMPLES = {
    "Assisted Living Facilities": "texas-assisted-living-facilities-complete-bundle",
    "Personal Home Care": "texas-personal-home-care-complete-bundle",
    "Residential Care (DD)": "texas-residential-care-dd-complete-bundle",
}


def example_for(program: str) -> str:
    slug = EXAMPLES.get(program, "texas-assisted-living-facilities-complete-bundle")
    d = json.loads((CF / "research" / f"{slug}.json").read_text())
    trimmed = {
        "state": d["state"], "program": d["program"], "state_program_name": d["state_program_name"],
        "key_numbers": d["key_numbers"][:4], "not_claimed": d["not_claimed"][:4],
        "rates": d["rates"][:3], "sections": {"executive_summary": d["sections"]["executive_summary"]},
        "checklist": d["checklist"][:6], "financial_model": d["financial_model"],
        "sources": d["sources"][:4],
    }
    return json.dumps(trimmed, ensure_ascii=False)


TOPICS = {
    "licensing": ("Licensing pathway and rules: the exact license/certification type(s) for this program, the "
                  "regulator(s) with phone/email/URL, governing statute and administrative code sections, application "
                  "steps in order, every fee and WHEN it is paid, processing timelines quoted from the rule, capacity "
                  "limits, staffing ratios/awake-overnight rules, administrator/manager qualifications and training "
                  "hours, background checks, inspections/surveys, zoning or siting rules, insurance or bond "
                  "requirements, and any 2026 pending rule changes."),
    "reimbursement": ("How operators get paid: Medicaid program/waiver names and how payment flows (fee-for-service vs "
                      "managed care), current published rates with procedure codes, units and effective dates, room "
                      "and board rules (SSI 2026 = $994), EVV requirements, provider enrollment steps and fees "
                      "(CY2026), private-pay price benchmarks for this state (CareScout/Genworth 2024-2025 with what "
                      "they measure), and any rate changes pending in 2026."),
    "workforce_costs": ("Workforce and operating costs: BLS OEWS May 2025 wages for this state for the roles this "
                        "program needs (aides, CNAs, LPN, RN, administrators/managers, cooks), the 2026 state minimum "
                        "wage and any higher local minimums in major metros, new-employer unemployment tax rate and "
                        "wage base, entity formation and annual fees/taxes (LLC, franchise), workers' compensation "
                        "rates if published, realistic rent benchmarks (HUD FY2026/2027 fair market rents for the "
                        "largest metro by bedroom count, or commercial rent surveys), and required insurance minimums."),
    "demand_market": ("Demand and market: waiting/interest lists, enrollment and caseload counts, population 65+ or "
                      "people with I/DD served, number of licensed providers/facilities (official lists), occupancy "
                      "data, referral sources, recent trends and news from official sources, and pending 2026 policy "
                      "changes affecting this program."),
}

FACT_SYSTEM = """You are a meticulous research assistant gathering VERIFIED facts for a business-licensing report.
Rules: prefer official sources (state agency sites, administrative code, statutes, CMS, SSA, BLS). Every fact must
include the exact supporting quote from the page you fetched and the page URL. Never guess or estimate. If you cannot
find something, list it under "unverified". Current year is 2026; use the latest values in effect.
Keep each quote under 200 characters. Return ONLY JSON (no prose before or after):
{"facts":[{"topic":"...","claim":"...","value":"...","quote":"exact text from the page",
"url":"...","title":"...","publisher":"...","type":"official|secondary","as_of":"..."}],"unverified":["..."]}"""


def gather(item: dict) -> dict:
    out = {"facts": [], "unverified": []}
    for topic, brief in TOPICS.items():
        user = (f"State: {item['state']}\nProgram: {item['program']}\nState terms/hints (verify, do not trust): "
                f"{item['terms']}\n\nResearch topic: {brief}\nAim for 20-40 facts. Fetch the primary pages; "
                "quote exactly. Return 20-35 facts as compact JSON.")
        tools = [{**WEB_SEARCH, "max_uses": 8}, {**WEB_FETCH, "max_uses": 10, "max_content_tokens": 6000}]
        try:
            txt = call(item["slug"], f"A:{topic}", HAIKU, FACT_SYSTEM, user, tools=tools, max_tokens=32000)
            d = parse_json(txt)
            out["facts"] += [f for f in d.get("facts", []) if isinstance(f, dict) and f.get("url") and f.get("value")]
            out["unverified"] += d.get("unverified", [])
        except BudgetExceeded:
            raise
        except Exception as e:  # keep going with other topics
            log({"slug": item["slug"], "stage": f"A:{topic}", "error": str(e)[:300]})
    return out


ASSEMBLE_SYSTEM = """You write Care Licensing Solutions bundle research JSON. Follow this spec exactly:

""" + SCHEMA + """

You will receive verified facts (with quotes and URLs). Use ONLY those facts for numbers; every number needs a
source_id that maps to sources[] built from the fact URLs. Anything not in the facts goes to not_claimed or is labeled
"operator estimate — verify locally" in notes (only for operating costs like insurance premiums, office rent detail).
Never invent rates. Return ONLY valid JSON."""


def assemble(item: dict, facts: dict) -> dict:
    ex = example_for(item["program"])
    base = (f"Bundle slug: {item['slug']}\nState: {item['state']} ({item['state_code']})\nWebsite program name: "
            f"{item['program']}\nState hints: {item['terms']}\nas_of: {time.strftime('%Y-%m')}\n\n"
            f"FACTS:\n{json.dumps(facts, ensure_ascii=False)}\n\nEXAMPLE of a finished bundle for the same program "
            f"in another state (structure and depth only; do not copy its numbers):\n{ex}\n")
    slug = item["slug"]
    # B1a: evidence and reference data
    d = parse_json(call(slug, "B1a:evidence", SONNET, ASSEMBLE_SYSTEM, base +
        "\nProduce a JSON object with keys: bundle_slug, state, state_code, program, state_program_name, as_of, "
        "report_title, sources (S1..Sn from the fact URLs you use), key_numbers (8-12), not_claimed, regulators, "
        "regulations, rates, contacts. Keep source titles short.", max_tokens=40000))
    # B1b: financial model
    fm_prompt = (base + "\nEVIDENCE already written (cite these source ids):\n" + json.dumps(d, ensure_ascii=False) +
        "\nProduce ONLY a JSON object {\"financial_model\": {...}} per the spec: 3-6 realistic configurations that "
        "meet the state's staffing rules, at least one an expert operator would choose to be profitable if real "
        "rates allow; rent and building costs fixed and sized per configuration with opex_overrides; startup_costs "
        "inside financial_model. Every numeric field must be a number, never null.")
    fm = parse_json(call(slug, "B1b:model", SONNET, ASSEMBLE_SYSTEM, fm_prompt, max_tokens=40000))
    d["financial_model"] = fm.get("financial_model", fm)
    err = model_error(d)
    if err:
        fm = parse_json(call(slug, "B1b:retry", SONNET, ASSEMBLE_SYSTEM, fm_prompt + "\nYour previous attempt failed "
                             "validation: " + err + "\nPrevious attempt:\n" + json.dumps(d["financial_model"]),
                             max_tokens=40000))
        d["financial_model"] = fm.get("financial_model", fm)
        err = model_error(d)
        if err:
            raise ValueError(f"financial model invalid after retry: {err}")
    res = rank(evaluate(d["financial_model"]))
    cfgs = {c["id"]: c for c in d["financial_model"]["configurations"]}
    summary = []
    for r in res:
        o = outlook(d["financial_model"], cfgs[r.id], r)
        summary.append({"id": r.id, "label": r.label, "net_month": round(r.results["default"]["net"]),
                        "margin": round(r.results["default"]["margin"], 3),
                        "breakeven_occupancy": None if r.breakeven_occupancy is None else round(r.breakeven_occupancy, 3),
                        "first_profit_month": o["first_profitable_month"], "cash_needed": round(o["cash_needed"])})
    ctx = (base + "\nBUNDLE SO FAR:\n" + json.dumps(d, ensure_ascii=False) +
           "\n\nMODEL RESULTS computed from it (use these exact numbers):\n" + json.dumps(summary))
    sec = parse_json(call(slug, "B2a:sections", SONNET, ASSEMBLE_SYSTEM, ctx +
        "\n\nProduce ONLY {\"sections\": {...}} with all 10 sections (executive_summary, service_model, "
        "licensing_pathway, reimbursement, demand, operations, market_conditions, financial_narrative, risks, "
        "recommendations), markdown with [S#] cites; financial_narrative explains drivers, sensitivities and the path "
        "to profit honestly.", max_tokens=40000))
    d["sections"] = sec.get("sections", sec)
    chk = parse_json(call(slug, "B2b:checklist", SONNET, ASSEMBLE_SYSTEM, ctx +
        "\n\nProduce ONLY {\"checklist\": [...]} with 50-80 items in phased order (\"PHASE 1 — ...\"), each with "
        "phase, priority (CRITICAL|HIGH|MEDIUM), task, instructions (how, where, cost, time), cite, source_id.",
        max_tokens=40000))
    d["checklist"] = chk.get("checklist", chk)
    d["corrections_vs_previous"] = []
    return normalize(d)


def normalize(d: dict) -> dict:
    """Drop incomplete items left by truncation and fill optional fields the generators read."""
    d["checklist"] = [c for c in d.get("checklist", []) if isinstance(c, dict) and c.get("task") and c.get("phase")]
    for c in d["checklist"]:
        c.setdefault("priority", "MEDIUM"); c.setdefault("instructions", ""); c.setdefault("cite", "")
    d["sources"] = [s for s in d.get("sources", []) if isinstance(s, dict) and s.get("id")]
    for s in d["sources"]:
        for k in ("title", "publisher", "url", "type", "accessed"):
            s.setdefault(k, "")
    d["key_numbers"] = [k for k in d.get("key_numbers", []) if isinstance(k, dict) and k.get("metric")]
    d["rates"] = [r for r in d.get("rates", []) if isinstance(r, dict) and r.get("service") is not None]
    d["regulators"] = [r for r in d.get("regulators", []) if isinstance(r, dict) and r.get("name")]
    d["regulations"] = [r for r in d.get("regulations", []) if isinstance(r, dict) and r.get("cite")]
    d["contacts"] = [c for c in d.get("contacts", []) if isinstance(c, dict) and c.get("name")]
    if "startup_costs" in d and "financial_model" in d:  # misplaced by a patch
        d["financial_model"].setdefault("startup_costs", d.pop("startup_costs"))
    return d


def model_error(d: dict) -> str:
    try:
        fm = d["financial_model"]
        if not fm.get("configurations"):
            return "no configurations"
        evaluate(fm)
        return ""
    except Exception as e:
        return f"{type(e).__name__}: {e}"


# ---------------------------------------------------------------- code checks
def code_checks(d: dict) -> list[str]:
    problems = []
    ids = {s["id"] for s in d.get("sources", [])}
    blob = json.dumps(d)
    for sid in set(re.findall(r'"source_id":\s*"(S\d+)"', blob)) | set(re.findall(r"\[(S\d+)\]", blob)):
        if sid not in ids:
            problems.append(f"source {sid} cited but not in sources[]")
    for key in ("sections", "checklist", "financial_model", "sources", "rates"):
        if not d.get(key):
            problems.append(f"missing {key}")
    for o in d.get("financial_model", {}).get("opex", []):
        if re.search(r"lease|rent\b|mortgage", o.get("item", ""), re.I) and o.get("basis") == "per_client":
            problems.append(f"building cost '{o['item']}' is per_client; must be fixed")
    try:
        evaluate(d["financial_model"])
    except Exception as e:
        problems.append(f"model error: {e}")
    return problems


# ---------------------------------------------------------------- verify + fix
VERIFY_SYSTEM = """You are an independent fact-checker. Check each listed claim against the cited URL (fetch it) or
the primary official source. Report only issues with evidence. Return ONLY JSON:
{"verified_count": N, "issues": [{"severity":"critical|major|minor","json_path":"...","current":...,
"correct":... or null,"evidence":"quote","source_url":"...","fix":"exact change"}]}
critical = changes profitability or a legal requirement. If unverifiable, say "unverifiable" in fix."""


def verify(item: dict, d: dict) -> dict:
    fm = d["financial_model"]
    focus = {
        "rates": d.get("rates"), "key_numbers": d.get("key_numbers"),
        "revenue_lines": {c["id"]: c["revenue_lines"] for c in fm["configurations"]},
        "staffing": {c["id"]: c["staffing"] for c in fm["configurations"]},
        "opex": fm.get("opex"), "startup_costs": fm.get("startup_costs"), "payroll_burden": fm.get("payroll_burden"),
        "fees_and_timelines_in_checklist": [{"i": i, "task": c["task"], "instructions": c["instructions"],
                                             "cite": c.get("cite"), "source_id": c.get("source_id")}
                                            for i, c in enumerate(d.get("checklist", []))
                                            if re.search(r"\$|\bday|fee|hour|ratio|staff", c.get("instructions", ""), re.I)][:30],
        "regulators": d.get("regulators"), "sources": d.get("sources"),
    }
    user = (f"{item['state']} — {item['program']}. Check the numbers that drive profit and legal accuracy: every "
            "rate, wage (BLS OEWS May 2025; at/above 2026 minimum wage), fee and when it is paid, staffing rule, "
            "timeline and contact. Also flag missing mandatory costs and staffing that violates the rules.\n\n"
            + json.dumps(focus, ensure_ascii=False))
    tools = [{**WEB_FETCH, "max_uses": 12, "max_content_tokens": 3000}, {**WEB_SEARCH, "max_uses": 4}]
    return parse_json(call(item["slug"], "D:verify", SONNET, VERIFY_SYSTEM, user, tools=tools, max_tokens=24000))


FIX_SYSTEM = """You apply fact-check corrections to a research JSON. Return ONLY JSON:
{"patches":[{"path":"dot.path[0].with.indexes","value":<new value>}], "log":[{"issue":"...","change":"..."}]}
Paths address existing fields (or a new list index equal to the list length to append). Startup costs live at
financial_model.startup_costs; opex at financial_model.opex; configurations at financial_model.configurations[i]. Fix every place the
wrong value appears, including narrative text (replace whole strings). Never raise rates or remove required costs
to improve profit. Unverifiable claims move to not_claimed (append) and out of customer text."""


def set_path(d, path: str, value) -> None:
    parts = re.findall(r"[^.\[\]]+|\[\d+\]", path)
    cur = d
    for i, p in enumerate(parts):
        last = i == len(parts) - 1
        if p.startswith("["):
            idx = int(p[1:-1])
            if last:
                if idx == len(cur):
                    cur.append(value)
                else:
                    cur[idx] = value
            else:
                cur = cur[idx]
        else:
            if last:
                cur[p] = value
            else:
                cur = cur.setdefault(p, {})


def fix(item: dict, d: dict, findings: dict) -> dict:
    if not findings.get("issues"):
        return d
    text_fields = {"sections": d.get("sections"), "key_numbers": d.get("key_numbers"),
                   "not_claimed": d.get("not_claimed")}
    user = ("FINDINGS:\n" + json.dumps(findings, ensure_ascii=False) + "\n\nCURRENT financial_model, rates, "
            "regulators, contacts:\n" + json.dumps({k: d.get(k) for k in ("financial_model", "rates", "regulators",
                                                                         "contacts")}, ensure_ascii=False) +
            "\n\nCURRENT text fields:\n" + json.dumps(text_fields, ensure_ascii=False) +
            "\n\nChecklist items referenced by findings are addressed as checklist[i].field.")
    out = parse_json(call(item["slug"], "E:fix", SONNET, FIX_SYSTEM, user, max_tokens=40000))
    applied = 0
    for p in out.get("patches", []):
        try:
            try:
                set_path(d, p["path"], p["value"])
            except (KeyError, IndexError, TypeError):
                alt = re.sub(r"^financial_model\.(?=(rates|key_numbers|sources|regulators|contacts|checklist|sections))", "", p["path"])
                if alt == p["path"]:
                    raise
                set_path(d, alt, p["value"])
            applied += 1
        except Exception as e:
            log({"slug": item["slug"], "stage": "E:patch", "error": f"{p.get('path')}: {e}"})
    d.setdefault("verification_log", []).extend(out.get("log", []))
    log({"slug": item["slug"], "stage": "E:applied", "patches": applied})
    return d


# ---------------------------------------------------------------- per bundle
def process(item: dict) -> dict:
    slug = item["slug"]
    research = CF / "research" / f"{slug}.json"
    if research.exists():
        return {"slug": slug, "status": "skipped (already done)"}
    facts_path = CF / "pipeline" / "work" / f"{slug}.facts.json"
    facts_path.parent.mkdir(parents=True, exist_ok=True)
    facts = json.loads(facts_path.read_text()) if facts_path.exists() else {}
    if len(facts.get("facts", [])) >= 15:
        pass
    else:
        facts = gather(item)
        facts_path.write_text(json.dumps(facts, indent=2, ensure_ascii=False))
        if len(facts.get("facts", [])) < 15:
            raise ValueError(f"only {len(facts.get('facts', []))} facts gathered; not assembling")
    d = assemble(item, facts)
    problems = code_checks(d)
    if problems:
        log({"slug": slug, "stage": "C:checks", "problems": problems[:20]})
    pre_fix_fm = json.loads(json.dumps(d["financial_model"]))
    findings = verify(item, d)
    (CF / "verification").mkdir(exist_ok=True)
    (CF / "verification" / f"{slug}.json").write_text(json.dumps(
        {"bundle_slug": slug, "checked_at": time.strftime("%Y-%m-%d"), "pre_fix_code_checks": problems, **findings},
        indent=2, ensure_ascii=False))
    d = normalize(fix(item, d, findings))
    if model_error(d):  # a bad patch broke the model: keep the pre-fix model
        log({"slug": slug, "stage": "E:rollback", "error": model_error(d)})
        d["financial_model"] = json.loads(json.dumps(pre_fix_fm))
    remaining = code_checks(d)
    research.write_text(json.dumps(d, indent=2, ensure_ascii=False))
    subprocess.run([sys.executable, str(CF / "generators" / "build.py"), str(research)], check=True)
    best = rank(evaluate(d["financial_model"]))[0]
    return {"slug": slug, "status": "done", "usd": SPEND["by_bundle"].get(slug, 0),
            "best": best.label, "best_net": round(best.results["default"]["net"]),
            "issues": len(findings.get("issues", [])), "remaining_checks": remaining[:5]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs", default="")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    queue = json.loads((CF / "pipeline" / "queue.json").read_text())
    if a.slugs:
        want = [s.strip() for s in a.slugs.split(",") if s.strip()]
        queue = [q for q in queue if q["slug"] in want]
    queue = [q for q in queue if not (CF / "research" / f"{q['slug']}.json").exists()]
    if a.limit:
        queue = queue[: a.limit]
    log({"stage": "start", "bundles": [q["slug"] for q in queue], "spent_so_far": SPEND["total_usd"],
         "budget": BUDGET})
    results = []
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = {ex.submit(process, q): q["slug"] for q in queue}
        for f in as_completed(futs):
            slug = futs[f]
            try:
                r = f.result()
            except BudgetExceeded as e:
                r = {"slug": slug, "status": f"stopped: {e}"}
            except Exception as e:
                r = {"slug": slug, "status": f"error: {e}", "trace": traceback.format_exc()[-800:]}
            results.append(r)
            log({"stage": "bundle", **r})
    log({"stage": "end", "spent_total": SPEND["total_usd"], "done": sum(r["status"] == "done" for r in results)})


if __name__ == "__main__":
    main()

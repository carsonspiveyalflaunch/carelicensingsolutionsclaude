"""Build customer files for one or more research JSONs.

Usage: python3 generators/build.py research/<slug>.json [...]
Writes content-factory/output/<slug>/{Pro Forma P&L, Licensing Checklist, Market Research Report}.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

ROOT = Path(__file__).resolve().parent.parent


def names(d: dict) -> dict:
    base = f"{d['state']} {d['program']}"
    return {
        "pnl": f"{base} - Pro Forma PnL.xlsx",
        "checklist": f"{base} - Licensing Checklist.xlsx",
        "report": f"{base} - Market Research Report.pdf",
    }


def build(path: str) -> Path:
    from pnl import build_pnl
    d = json.load(open(path))
    out = ROOT / "output" / d["bundle_slug"]
    out.mkdir(parents=True, exist_ok=True)
    n = names(d)
    build_pnl(d, str(out / n["pnl"]))
    from checklist import build_checklist
    from report import build_report
    build_checklist(d, str(out / n["checklist"]))
    build_report(d, str(out / n["report"]))
    return out


if __name__ == "__main__":
    for p in sys.argv[1:]:
        print("built", build(p))

"""Financial model shared by the P&L workbook and the market research report.

The workbook carries live formulas; this module computes the same numbers in Python so the
generator can rank configurations, write the report's Section 8 and cross-check the workbook
after LibreOffice recalculates it.
"""
from __future__ import annotations

from dataclasses import dataclass, field

DAYS_PER_MONTH = 30.42


def opex_for(fm: dict, cfg: dict) -> list[dict]:
    """Base opex with this configuration's overrides applied (matched by item name; new items added)."""
    items = [dict(o) for o in fm.get("opex", [])]
    for ov in cfg.get("opex_overrides", []) or []:
        for i, o in enumerate(items):
            if o["item"] == ov["item"]:
                items[i] = {**o, **ov}
                break
        else:
            items.append(dict(ov))
    return items


def rev_line_monthly(line: dict) -> float:
    return float(line["rate"]) * float(line.get("units_per_client_month", 1) or 0) * float(
        line.get("share_of_clients", 1) if line.get("share_of_clients") is not None else 1
    )


def staff_monthly(s: dict) -> tuple[float, float]:
    """Return (fixed monthly cost, variable cost per billable client per month)."""
    basis = s["basis"]
    amt = float(s.get("amount") or 0)
    wage = float(s.get("wage_hourly") or 0)
    if basis == "annual_salary":
        return amt / 12.0, 0.0
    if basis == "hours_per_month":
        return wage * amt, 0.0
    if basis == "hours_per_client_month":
        return 0.0, wage * amt
    raise ValueError(f"unknown staffing basis {basis!r}")


@dataclass
class ConfigResult:
    id: str
    label: str
    capacity: float
    rev_per_client: float
    fixed_labor: float
    var_labor: float
    burden: float
    fixed_opex: float
    var_opex: float
    results: dict = field(default_factory=dict)  # occupancy -> dict

    def at(self, occ: float) -> dict:
        billable = self.capacity * occ
        revenue = billable * self.rev_per_client
        wages = self.fixed_labor + billable * self.var_labor
        burden = wages * self.burden
        opex = self.fixed_opex + billable * self.var_opex
        expenses = wages + burden + opex
        net = revenue - expenses
        return {
            "occupancy": occ, "billable": billable, "revenue": revenue, "wages": wages,
            "burden": burden, "opex": opex, "expenses": expenses, "net": net,
            "margin": (net / revenue) if revenue else 0.0,
        }

    @property
    def contribution_per_client(self) -> float:
        return self.rev_per_client - self.var_labor * (1 + self.burden) - self.var_opex

    @property
    def fixed_costs(self) -> float:
        return self.fixed_labor * (1 + self.burden) + self.fixed_opex

    @property
    def breakeven_clients(self) -> float | None:
        c = self.contribution_per_client
        return self.fixed_costs / c if c > 0 else None

    @property
    def breakeven_occupancy(self) -> float | None:
        be = self.breakeven_clients
        return be / self.capacity if be is not None and self.capacity else None


def evaluate(fm: dict) -> list[ConfigResult]:
    pb = fm.get("payroll_burden", {})
    burden = float(pb.get("payroll_tax_pct", 0)) + float(pb.get("workers_comp_pct", 0)) + float(
        pb.get("benefits_pct", 0)
    )
    occ = fm["occupancy"]
    out = []
    for cfg in fm["configurations"]:
        fixed_l = var_l = 0.0
        for s in cfg.get("staffing", []):
            f, v = staff_monthly(s)
            fixed_l += f
            var_l += v
        fixed_o = var_o = 0.0
        for o in opex_for(fm, cfg):
            if o.get("basis", "fixed") == "per_client":
                var_o += float(o["monthly"])
            else:
                fixed_o += float(o["monthly"])
        r = ConfigResult(
            id=cfg["id"], label=cfg["label"], capacity=float(cfg["capacity"]),
            rev_per_client=sum(rev_line_monthly(l) for l in cfg["revenue_lines"]),
            fixed_labor=fixed_l, var_labor=var_l, burden=burden, fixed_opex=fixed_o, var_opex=var_o,
        )
        for name in ("conservative", "default", "optimistic"):
            if occ.get(name) is not None:
                r.results[name] = r.at(float(occ[name]))
        out.append(r)
    return out


def rank(results: list[ConfigResult]) -> list[ConfigResult]:
    """Profitable-at-default first (highest net first), then the rest by net."""
    return sorted(results, key=lambda r: (r.results["default"]["net"] <= 0, -r.results["default"]["net"]))


def ramp_for(fm: dict, cfg: dict) -> dict:
    """Configuration ramp overrides the bundle default (bigger homes fill faster in absolute terms)."""
    base = dict(fm.get("ramp", {}) or {})
    base.update(cfg.get("ramp", {}) or {})
    base.setdefault("start_clients", 1)
    base.setdefault("add_per_month", 1)
    return base


def size_position(fm: dict, cfg: dict) -> float:
    """0 for the smallest configuration, 1 for the largest; scales startup ranges by size."""
    caps = [float(c["capacity"]) for c in fm["configurations"]]
    lo, hi = min(caps), max(caps)
    return 0.5 if hi == lo else (float(cfg["capacity"]) - lo) / (hi - lo)


def startup_items(fm: dict, cfg: dict) -> list[dict]:
    """Startup lines with the amount for this configuration's size. Working-capital lines are
    replaced by the modeled ramp-up deficit, so they are flagged rather than summed."""
    t = size_position(fm, cfg)
    out = []
    for s in cfg.get("startup_costs") or fm.get("startup_costs", []):
        if s.get("min_capacity") and float(cfg["capacity"]) < float(s["min_capacity"]):
            continue
        low = float(s.get("low", 0) or 0)
        high = float(s.get("high", low) or low)
        out.append({**s, "amount": low + (high - low) * t})
    return out


def startup_total(fm: dict, cfg: dict) -> float:
    """One-time costs only (excludes working capital and required reserves)."""
    return sum(s["amount"] for s in startup_items(fm, cfg) if not s.get("category"))


def required_reserve(fm: dict, cfg: dict) -> float:
    return sum(s["amount"] for s in startup_items(fm, cfg) if s.get("category") == "required_reserve")


def projection(fm: dict, cfg: dict, cr: ConfigResult, months: int = 36) -> list[dict]:
    """Month-by-month with the ramp (mirrors the workbook formulas)."""
    occ = float(fm["occupancy"]["default"])
    ramp = ramp_for(fm, cfg)
    start, add = float(ramp["start_clients"]), float(ramp["add_per_month"])
    rows, cum = [], 0.0
    for m in range(1, months + 1):
        clients = min(cr.capacity, start + add * (m - 1))
        billable = clients * occ
        revenue = billable * cr.rev_per_client
        wages = cr.fixed_labor + billable * cr.var_labor
        burden = wages * cr.burden
        opex = cr.fixed_opex + billable * cr.var_opex
        net = revenue - wages - burden - opex
        cum += net
        rows.append({"month": m, "clients": clients, "revenue": revenue, "expenses": wages + burden + opex,
                     "net": net, "cumulative": cum})
    return rows


def year1(fm: dict, cfg: dict, cr: ConfigResult) -> list[dict]:
    return projection(fm, cfg, cr, 12)


def outlook(fm: dict, cfg: dict, cr: ConfigResult) -> dict:
    rows = projection(fm, cfg, cr, 36)
    startup = startup_total(fm, cfg)
    reserve = required_reserve(fm, cfg)
    first_profit = next((r["month"] for r in rows if r["net"] > 0), None)
    low = min(0.0, min(r["cumulative"] for r in rows))
    payback = next((r["month"] for r in rows if r["cumulative"] - startup >= 0), None)
    return {
        "year_net": [sum(r["net"] for r in rows[i * 12:(i + 1) * 12]) for i in range(3)],
        "first_profitable_month": first_profit,
        "operating_deficit": -low,
        "startup": startup,
        "required_reserve": reserve,
        "cash_needed": startup + max(-low, reserve),
        "payback_month": payback,
        "rows": rows,
    }

"""Pro Forma P&L workbook (Oklahoma standard): one live-formula P&L sheet per configuration,
a Configurations comparison with break-even, Rate Matrix, Instructions and Sources."""
from __future__ import annotations

import re

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation

from model import DAYS_PER_MONTH, evaluate, opex_for, rank, ramp_for, startup_items, outlook

FONT = "Arial"
GREEN = "1F4E3D"
INPUT = PatternFill("solid", fgColor="FFF4C2")
TOTAL = PatternFill("solid", fgColor="DCEBF7")
HEAD = PatternFill("solid", fgColor=GREEN)
SECTION = PatternFill("solid", fgColor="E8F1EC")
THIN = Side(style="thin", color="BFBFBF")
USD = '$#,##0;[Red]($#,##0);"–"'
USD2 = '$#,##0.00;[Red]($#,##0.00);"–"'
PCT = '0.0%;[Red]-0.0%;"–"'
NUM = '#,##0.0;[Red]-#,##0.0;"–"'


def f(bold=False, color="000000", size=10, italic=False):
    return Font(name=FONT, bold=bold, color=color, size=size, italic=italic)


def put(ws, ref, value, *, bold=False, fmt=None, fill=None, color="000000", italic=False, wrap=False, size=10):
    c = ws[ref]
    c.value = value
    c.font = f(bold, color, size, italic)
    if fmt:
        c.number_format = fmt
    if fill:
        c.fill = fill
    c.alignment = Alignment(vertical="top", wrap_text=wrap)
    return c


def header_row(ws, row, labels, start_col=1):
    for i, lab in enumerate(labels):
        c = ws.cell(row=row, column=start_col + i, value=lab)
        c.font = f(True, "FFFFFF")
        c.fill = HEAD
        c.alignment = Alignment(vertical="center", wrap_text=True)


def src_ids(sid) -> list[str]:
    if not sid:
        return []
    if isinstance(sid, list):
        return [x.strip() for x in sid if x]
    return [x.strip() for x in re.split(r"[;,]", str(sid)) if x.strip()]


def src_label(sources: dict, sid) -> str:
    parts = []
    for i in src_ids(sid):
        s = sources.get(i)
        parts.append(f"{i}: {s['publisher']}" if s else i)
    return "; ".join(parts)


def config_sheet(wb, d, cfg, cr, idx, sources):
    fm = d["financial_model"]
    title = f"P&L {idx} - {cfg['label']}"[:31].replace("/", "-").replace(":", "")
    ws = wb.create_sheet(title)
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 52
    for col in range(2, 17):
        ws.column_dimensions[L(col)].width = 13
    put(ws, "A1", f"{d['state']} {d['state_program_name']} — Pro Forma P&L", bold=True, size=14, color=GREEN)
    put(ws, "A2", f"Configuration: {cfg['label']}. {cfg.get('notes','')}", italic=True, wrap=True)
    ws.merge_cells("A2:N2")
    ws.row_dimensions[2].height = 30
    put(ws, "A3", "Yellow cells are inputs you can change. Every other number is a formula.", italic=True,
        color="7F6000")

    # ---- Inputs
    r = 5
    put(ws, f"A{r}", "KEY INPUTS", bold=True, fill=SECTION)
    occ = fm["occupancy"]
    ramp = ramp_for(fm, cfg)
    pb = fm.get("payroll_burden", {})
    inputs = [
        ("Capacity (" + fm.get("capacity_unit", "client") + "s)", cfg["capacity"], NUM,
         "Staffing below is sized for this capacity. To change the number of residents, use the 'Scale It' tab."),
        ("Effective occupancy / billable share", occ["default"], PCT, occ.get("rationale", "")),
        ("Starting census (month 1)", ramp.get("start_clients", 1), NUM, ramp.get("note", "Ramp-up start")),
        ("Added per month during ramp-up", ramp.get("add_per_month", 1), NUM, "Ramp-up speed"),
        ("Payroll taxes (% of wages)", pb.get("payroll_tax_pct", 0), PCT, pb.get("notes", "")),
        ("Workers' compensation (% of wages)", pb.get("workers_comp_pct", 0), PCT, ""),
        ("Benefits / PTO (% of wages)", pb.get("benefits_pct", 0), PCT, ""),
        ("Days per month (365 ÷ 12)", DAYS_PER_MONTH, "0.00", ""),
    ]
    cells = {}
    for i, (lab, val, fmt, note) in enumerate(inputs):
        row = r + 1 + i
        put(ws, f"A{row}", lab)
        put(ws, f"B{row}", float(val), fmt=fmt, fill=INPUT)
        put(ws, f"C{row}", note, italic=True, color="595959")
        cells[i] = f"$B${row}"
    CAP, OCC, START, ADD, TAX, WC, BEN, _DAYS = (cells[i] for i in range(8))
    r = r + 1 + len(inputs) + 1

    # ---- Revenue lines
    put(ws, f"A{r}", "REVENUE PER " + fm.get("capacity_unit", "client").upper() + " PER MONTH", bold=True,
        fill=SECTION)
    r += 1
    header_row(ws, r, ["Revenue line", "Rate", "Unit", "Units / month", "Share of census", "$ / month",
                       "Payer / code", "Source"])
    r += 1
    rev_first = r
    for line in cfg["revenue_lines"]:
        put(ws, f"A{r}", line["name"], wrap=True)
        put(ws, f"B{r}", float(line["rate"]), fmt=USD2, fill=INPUT)
        put(ws, f"C{r}", line.get("unit", ""))
        put(ws, f"D{r}", float(line.get("units_per_client_month", 1)), fmt="0.00", fill=INPUT)
        put(ws, f"E{r}", float(line.get("share_of_clients", 1)), fmt=PCT, fill=INPUT)
        put(ws, f"F{r}", f"=B{r}*D{r}*E{r}", fmt=USD)
        put(ws, f"G{r}", " ".join(x for x in [line.get("payer", ""), line.get("code", "")] if x))
        put(ws, f"H{r}", src_label(sources, line.get("source_id")), italic=True, color="595959")
        r += 1
    rev_last = r - 1
    put(ws, f"A{r}", "Revenue per " + fm.get("capacity_unit", "client") + " per month", bold=True)
    put(ws, f"F{r}", f"=SUM(F{rev_first}:F{rev_last})", bold=True, fmt=USD, fill=TOTAL)
    REVPC = f"$F${r}"
    r += 2

    # ---- Staffing
    put(ws, f"A{r}", "STAFFING", bold=True, fill=SECTION)
    r += 1
    header_row(ws, r, ["Role", "Hourly wage", "Basis", "Hours or salary", "Fixed $ / month",
                       "$ per billable " + fm.get("capacity_unit", "client"), "Rule / note", "Wage source"])
    r += 1
    st_first = r
    for s in cfg.get("staffing", []):
        put(ws, f"A{r}", s["role"], wrap=True)
        if s.get("wage_hourly") is not None:
            put(ws, f"B{r}", float(s["wage_hourly"]), fmt=USD2, fill=INPUT)
        put(ws, f"C{r}", s["basis"])
        put(ws, f"D{r}", float(s.get("amount") or 0), fmt="#,##0.0", fill=INPUT)
        if s["basis"] == "annual_salary":
            put(ws, f"E{r}", f"=D{r}/12", fmt=USD)
            put(ws, f"F{r}", 0, fmt=USD)
        elif s["basis"] == "hours_per_month":
            put(ws, f"E{r}", f"=B{r}*D{r}", fmt=USD)
            put(ws, f"F{r}", 0, fmt=USD)
        else:
            put(ws, f"E{r}", 0, fmt=USD)
            put(ws, f"F{r}", f"=B{r}*D{r}", fmt=USD)
        put(ws, f"G{r}", " ".join(x for x in [s.get("cite", ""), s.get("notes", "")] if x)[:250], italic=True,
            color="595959", wrap=False)
        put(ws, f"H{r}", src_label(sources, s.get("wage_source_id")), italic=True, color="595959")
        r += 1
    st_last = r - 1
    put(ws, f"A{r}", "Staffing totals", bold=True)
    put(ws, f"E{r}", f"=SUM(E{st_first}:E{st_last})", bold=True, fmt=USD, fill=TOTAL)
    put(ws, f"F{r}", f"=SUM(F{st_first}:F{st_last})", bold=True, fmt=USD, fill=TOTAL)
    FIXL, VARL = f"$E${r}", f"$F${r}"
    r += 2

    # ---- Opex
    put(ws, f"A{r}", "OPERATING EXPENSES (monthly)", bold=True, fill=SECTION)
    r += 1
    header_row(ws, r, ["Expense", "Monthly $", "Basis", "", "", "", "Note", "Source"])
    r += 1
    op_first = r
    for o in opex_for(fm, cfg):
        put(ws, f"A{r}", o["item"], wrap=True)
        put(ws, f"B{r}", float(o["monthly"]), fmt=USD, fill=INPUT)
        put(ws, f"C{r}", o.get("basis", "fixed"))
        put(ws, f"G{r}", (o.get("notes") or "")[:250], italic=True, color="595959")
        put(ws, f"H{r}", src_label(sources, o.get("source_id")), italic=True, color="595959")
        r += 1
    op_last = r - 1
    put(ws, f"A{r}", "Fixed opex per month", bold=True)
    put(ws, f"B{r}", f'=SUMIF(C{op_first}:C{op_last},"<>per_client",B{op_first}:B{op_last})', bold=True,
        fmt=USD, fill=TOTAL)
    FIXO = f"$B${r}"
    r += 1
    put(ws, f"A{r}", "Opex per billable " + fm.get("capacity_unit", "client") + " per month", bold=True)
    put(ws, f"B{r}", f'=SUMIF(C{op_first}:C{op_last},"per_client",B{op_first}:B{op_last})', bold=True,
        fmt=USD, fill=TOTAL)
    VARO = f"$B${r}"
    r += 2

    # ---- Income statement
    put(ws, f"A{r}", "INCOME STATEMENT — YEAR 1 (with ramp-up) and STABILIZED MONTH", bold=True, fill=SECTION)
    r += 1
    header_row(ws, r, ["", *[f"Month {m}" for m in range(1, 13)], "Year 1 total", "Stabilized month"])
    r += 1
    row_census, row_bill, row_rev = r, r + 1, r + 2
    row_fl, row_vl, row_w, row_b = r + 4, r + 5, r + 6, r + 7
    row_fo, row_vo, row_exp = r + 9, r + 10, r + 12
    row_net, row_mgn, row_cum = r + 14, r + 15, r + 16
    labels = {
        row_census: "Census (" + fm.get("capacity_unit", "client") + "s on service)",
        row_bill: "Billable census (census × occupancy)",
        row_rev: "TOTAL REVENUE",
        row_fl: "Fixed staffing",
        row_vl: "Census-driven staffing",
        row_w: "Total wages",
        row_b: "Payroll taxes, workers' comp, benefits",
        row_fo: "Fixed operating expenses",
        row_vo: "Census-driven operating expenses",
        row_exp: "TOTAL EXPENSES",
        row_net: "NET INCOME",
        row_mgn: "Net margin",
        row_cum: "Cumulative net income",
    }
    for rr, lab in labels.items():
        put(ws, f"A{rr}", lab, bold=rr in (row_rev, row_exp, row_net))
    for m in range(1, 15):
        col = L(m + 1)
        stab = m == 14
        total = m == 13
        if total:
            for rr in (row_rev, row_fl, row_vl, row_w, row_b, row_fo, row_vo, row_exp, row_net):
                put(ws, f"{col}{rr}", f"=SUM(B{rr}:M{rr})", fmt=USD, bold=True, fill=TOTAL)
            put(ws, f"{col}{row_mgn}", f"=IF({col}{row_rev}=0,0,{col}{row_net}/{col}{row_rev})", fmt=PCT,
                bold=True, fill=TOTAL)
            continue
        census = f"={CAP}" if stab else f"=MIN({CAP},{START}+{ADD}*{m - 1})"
        put(ws, f"{col}{row_census}", census, fmt=NUM)
        put(ws, f"{col}{row_bill}", f"={col}{row_census}*{OCC}", fmt=NUM)
        put(ws, f"{col}{row_rev}", f"={col}{row_bill}*{REVPC}", fmt=USD, bold=True)
        put(ws, f"{col}{row_fl}", f"={FIXL}", fmt=USD)
        put(ws, f"{col}{row_vl}", f"={col}{row_bill}*{VARL}", fmt=USD)
        put(ws, f"{col}{row_w}", f"={col}{row_fl}+{col}{row_vl}", fmt=USD)
        put(ws, f"{col}{row_b}", f"={col}{row_w}*({TAX}+{WC}+{BEN})", fmt=USD)
        put(ws, f"{col}{row_fo}", f"={FIXO}", fmt=USD)
        put(ws, f"{col}{row_vo}", f"={col}{row_bill}*{VARO}", fmt=USD)
        put(ws, f"{col}{row_exp}", f"={col}{row_w}+{col}{row_b}+{col}{row_fo}+{col}{row_vo}", fmt=USD,
            bold=True)
        put(ws, f"{col}{row_net}", f"={col}{row_rev}-{col}{row_exp}", fmt=USD, bold=True, fill=TOTAL)
        put(ws, f"{col}{row_mgn}", f"=IF({col}{row_rev}=0,0,{col}{row_net}/{col}{row_rev})", fmt=PCT)
        if not stab:
            prev = f"{L(m)}{row_cum}+" if m > 1 else ""
            put(ws, f"{col}{row_cum}", f"={prev}{col}{row_net}", fmt=USD)
    r = row_cum + 2

    # ---- Break-even
    put(ws, f"A{r}", "BREAK-EVEN (stabilized)", bold=True, fill=SECTION)
    burden = f"({TAX}+{WC}+{BEN})"
    contrib = f"({REVPC}-{VARL}*(1+{burden})-{VARO})"
    fixed = f"({FIXL}*(1+{burden})+{FIXO})"
    put(ws, f"A{r + 1}", "Contribution per billable " + fm.get("capacity_unit", "client") + " per month")
    put(ws, f"B{r + 1}", f"={contrib}", fmt=USD)
    put(ws, f"A{r + 2}", "Fixed costs per month (incl. burden)")
    put(ws, f"B{r + 2}", f"={fixed}", fmt=USD)
    put(ws, f"A{r + 3}", "Break-even billable census")
    put(ws, f"B{r + 3}", f'=IF(B{r + 1}<=0,"Not reachable",B{r + 2}/B{r + 1})', fmt=NUM, bold=True, fill=TOTAL)
    put(ws, f"A{r + 4}", "Break-even occupancy")
    put(ws, f"B{r + 4}", f'=IF(B{r + 1}<=0,"Not reachable",B{r + 3}/{CAP})', fmt=PCT, bold=True, fill=TOTAL)
    be = r
    r = r + 6

    # ---- Startup costs and cash needed
    put(ws, f"A{r}", "STARTUP COSTS (one-time, sized for this configuration)", bold=True, fill=SECTION)
    r += 1
    header_row(ws, r, ["Item", "Amount", "Low", "High", "", "", "Note", "Source"])
    r += 1
    su_first = r
    reserve_rows = []
    for item in startup_items(fm, cfg):
        cat = item.get("category")
        label = item["item"]
        if cat == "working_capital":
            label += " — replaced by the modeled ramp-up deficit below"
        elif cat == "required_reserve":
            label += " — required reserve (cash you must show, compared with the deficit below)"
        put(ws, f"A{r}", label, wrap=True)
        put(ws, f"B{r}", 0 if cat else round(item["amount"], 2), fmt=USD, fill=INPUT)
        put(ws, f"C{r}", float(item.get("low", 0) or 0), fmt=USD, italic=True, color="595959")
        put(ws, f"D{r}", float(item.get("high", 0) or 0), fmt=USD, italic=True, color="595959")
        put(ws, f"G{r}", (item.get("notes") or "")[:250], italic=True, color="595959")
        put(ws, f"H{r}", src_label(sources, item.get("source_id")), italic=True, color="595959")
        if cat == "required_reserve":
            reserve_rows.append(item["amount"])
        r += 1
    su_last = r - 1
    put(ws, f"A{r}", "Total one-time startup costs", bold=True)
    put(ws, f"B{r}", f"=SUM(B{su_first}:B{su_last})", fmt=USD, bold=True, fill=TOTAL)
    SU = f"$B${r}"
    r += 1
    # sized to this configuration the same way the model scales startup ranges
    reserve_formula = f"{round(sum(reserve_rows), 2)}"
    put(ws, f"A{r}", "Required cash reserve (if the rules set one), sized for this configuration")
    put(ws, f"B{r}", f"={reserve_formula}", fmt=USD)
    RES = f"$B${r}"
    r += 2

    # ---- 36-month outlook
    put(ws, f"A{r}", "36-MONTH OUTLOOK — when it turns profitable and how much cash it takes", bold=True,
        fill=SECTION)
    r += 1
    sum_row = r
    r += 8
    header_row(ws, r, ["Month", "Census", "Revenue", "Expenses", "Net income", "Cumulative net",
                       "Cumulative after startup costs", "Profitable month?"])
    r += 1
    o_first = r
    for m in range(1, 37):
        put(ws, f"A{r}", m, fmt="0")
        put(ws, f"B{r}", f"=MIN({CAP},{START}+{ADD}*{m - 1})", fmt=NUM)
        put(ws, f"C{r}", f"=B{r}*{OCC}*{REVPC}", fmt=USD)
        put(ws, f"D{r}", f"={fixed}+B{r}*{OCC}*({VARL}*(1+{burden})+{VARO})", fmt=USD)
        put(ws, f"E{r}", f"=C{r}-D{r}", fmt=USD, bold=True)
        put(ws, f"F{r}", f"=E{r}" if m == 1 else f"=F{r - 1}+E{r}", fmt=USD)
        put(ws, f"G{r}", f"=F{r}-{SU}", fmt=USD)
        put(ws, f"H{r}", f'=IF(E{r}>0,A{r},"")', fmt="0")
        r += 1
    o_last = r - 1
    rng = lambda c: f"{c}{o_first}:{c}{o_last}"
    summary = [
        ("Year 1 net income", f"=SUM(E{o_first}:E{o_first + 11})", USD),
        ("Year 2 net income", f"=SUM(E{o_first + 12}:E{o_first + 23})", USD),
        ("Year 3 net income", f"=SUM(E{o_first + 24}:E{o_last})", USD),
        ("First month with positive net income", f'=IF(COUNT({rng("H")})=0,"Beyond 36 months",MIN({rng("H")}))', "0"),
        ("Largest operating deficit during ramp-up", f"=-MIN(0,MIN({rng('F')}))", USD),
        ("TOTAL CASH NEEDED (startup + larger of deficit or required reserve)",
         f"={SU}+MAX(-MIN(0,MIN({rng('F')})),{RES})", USD),
        ("Month startup costs are paid back",
         f'=IF(COUNTIF({rng("G")},">=0")=0,"Beyond 36 months",'
         f'SUMPRODUCT(MIN(IF({rng("G")}>=0,{rng("A")},999))))', "0"),
    ]
    for i, (lab, formula, fmt) in enumerate(summary):
        put(ws, f"A{sum_row + i}", lab, bold=i in (3, 5))
        c = put(ws, f"B{sum_row + i}", formula, fmt=fmt, bold=True, fill=TOTAL)
    # payback month as an array formula (works in Excel and LibreOffice)
    from openpyxl.worksheet.formula import ArrayFormula
    pb_ref = f"B{sum_row + 6}"
    ws[pb_ref] = ArrayFormula(pb_ref, f'=IF(COUNTIF({rng("G")},">=0")=0,"Beyond 36 months",'
                                      f'MIN(IF({rng("G")}>=0,{rng("A")},999)))')
    ws.freeze_panes = "B5"
    return {
        "y2_net": f"'{title}'!B{sum_row + 1}", "first_profit": f"'{title}'!B{sum_row + 3}",
        "cash_needed": f"'{title}'!B{sum_row + 5}", "payback": f"'{title}'!B{sum_row + 6}",
        "sheet": title, "stab_rev": f"'{title}'!O{row_rev}", "stab_exp": f"'{title}'!O{row_exp}",
        "stab_net": f"'{title}'!O{row_net}", "stab_mgn": f"'{title}'!O{row_mgn}",
        "y1_net": f"'{title}'!N{row_net}", "be_occ": f"'{title}'!B{be + 4}", "be_census": f"'{title}'!B{be + 3}",
        "contrib": f"'{title}'!B{be + 1}", "fixedc": f"'{title}'!B{be + 2}", "occ": f"'{title}'!{OCC.replace('$', '')}",
        "startup": f"'{title}'!{SU.replace('$', '')}",
        "cap": f"'{title}'!{CAP.replace('$', '')}", "revpc": f"'{title}'!{REVPC.replace('$', '')}",
    }


def build_pnl(d: dict, path: str) -> list:
    fm = d["financial_model"]
    sources = {s["id"]: s for s in d["sources"]}
    results = {r.id: r for r in evaluate(fm)}
    ordered = rank(list(results.values()))
    cfg_by_id = {c["id"]: c for c in fm["configurations"]}

    wb = Workbook()
    summary = wb.active
    summary.title = "Configurations"
    refs = []
    for i, cr in enumerate(ordered, start=1):
        refs.append((cr, config_sheet(wb, d, cfg_by_id[cr.id], cr, i, sources)))

    # ---- Configurations summary (formulas pull from each P&L sheet)
    ws = summary
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 46
    for col in range(2, 14):
        ws.column_dimensions[L(col)].width = 15
    put(ws, "A1", f"{d['state']} {d['state_program_name']} — Which configuration makes money?", bold=True,
        size=14, color=GREEN)
    put(ws, "A2", ("Stabilized monthly results for each configuration at the default occupancy, using verified "
                   f"{d['state']} rates and every cost the state's rules require. Sorted with the most profitable "
                   "first. Open each P&L tab to change inputs."), italic=True, wrap=True)
    ws.merge_cells("A2:H2")
    ws.row_dimensions[2].height = 42
    header_row(ws, 4, ["Configuration", "Capacity", "Revenue / client / mo", "Stabilized revenue / mo",
                       "Stabilized expenses / mo", "Stabilized net / mo", "Net margin", "Break-even occupancy",
                       "Year 1 net (with ramp-up)", "Year 2 net", "First profitable month",
                       "Total cash needed", "Startup paid back (month)"])
    for i, (cr, ref) in enumerate(refs):
        row = 5 + i
        put(ws, f"A{row}", cr.label, wrap=True, bold=i == 0)
        put(ws, f"B{row}", f"={ref['cap']}", fmt="#,##0")
        put(ws, f"C{row}", f"={ref['revpc']}", fmt=USD)
        put(ws, f"D{row}", f"={ref['stab_rev']}", fmt=USD)
        put(ws, f"E{row}", f"={ref['stab_exp']}", fmt=USD)
        put(ws, f"F{row}", f"={ref['stab_net']}", fmt=USD, bold=True, fill=TOTAL)
        put(ws, f"G{row}", f"={ref['stab_mgn']}", fmt=PCT)
        put(ws, f"H{row}", f"={ref['be_occ']}", fmt=PCT)
        # Year-1 net sits in the Year 1 total column of the net row
        put(ws, f"I{row}", f"={ref['y1_net']}", fmt=USD)
        put(ws, f"J{row}", f"={ref['y2_net']}", fmt=USD)
        put(ws, f"K{row}", f"={ref['first_profit']}", fmt="0")
        put(ws, f"L{row}", f"={ref['cash_needed']}", fmt=USD)
        put(ws, f"M{row}", f"={ref['payback']}", fmt="0")
    note_row = 6 + len(refs)
    occ = fm["occupancy"]
    put(ws, f"A{note_row}", f"Default occupancy {occ['default']:.0%} (conservative {occ.get('conservative', 0):.0%}, "
                            f"optimistic {occ.get('optimistic', 0):.0%}). {occ.get('rationale', '')}",
        italic=True, wrap=True, color="595959")
    ws.merge_cells(f"A{note_row}:M{note_row}")
    ws.row_dimensions[note_row].height = 45
    best = ordered[0]
    msg_row = note_row + 2
    if best.results["default"]["net"] > 0:
        o = outlook(fm, cfg_by_id[best.id], best)
        pay = (f"pays back its startup costs in month {o['payback_month']}" if o["payback_month"]
               else "pays back its startup costs after month 36")
        msg = (f"Path to profit: '{best.label}' clears break-even at about "
               f"{best.breakeven_occupancy:.0%} occupancy, nets about "
               f"${best.results['default']['net']:,.0f} per month once stabilized, turns a monthly profit in "
               f"month {o['first_profitable_month']} and {pay}. Plan for about ${o['cash_needed']:,.0f} "
               f"in total cash.")
    else:
        msg = ("No configuration modeled here is profitable at the default occupancy with current rates. "
               "See the report's Section 8 and 10 for the price, size or payer mix required.")
    put(ws, f"A{msg_row}", msg, bold=True, color=GREEN, wrap=True)
    ws.merge_cells(f"A{msg_row}:M{msg_row}")
    ws.row_dimensions[msg_row].height = 32

    # ---- Scale It: enter a resident count, pick a model, see the result
    sc = wb.create_sheet("Scale It", 1)
    sc.sheet_view.showGridLines = False
    unit = fm.get("capacity_unit", "client")
    sc.column_dimensions["A"].width = 44
    for col in range(2, 12):
        sc.column_dimensions[L(col)].width = 15
    put(sc, "A1", f"Scale It — how many {unit}s do you want to serve?", bold=True, size=14, color=GREEN)
    put(sc, "A2", (f"Type the number of {unit}s and pick an operating model. The model is treated as one licensed "
                   "unit (home, facility or agency team). Above its capacity another unit is added with its own "
                   "staffing and fixed costs, which is how operators grow under the state's rules."),
        italic=True, wrap=True)
    sc.merge_cells("A2:H2")
    sc.row_dimensions[2].height = 44
    put(sc, "A19", "MODELS AVAILABLE (pulled live from the P&L tabs — edit inputs there)", bold=True, fill=SECTION)
    header_row(sc, 20, ["Operating model", "Capacity per unit", f"Revenue / {unit} / mo",
                        f"Contribution / billable {unit}", "Fixed costs / unit / mo", "Occupancy",
                        "Startup costs / unit"])
    def safe(label: str) -> str:  # MATCH treats ~ * ? as wildcards
        return label.replace("~", "approx. ").replace("*", "x").replace("?", "")

    for i, (cr, ref) in enumerate(refs):
        row = 21 + i
        put(sc, f"A{row}", safe(cr.label), wrap=True)
        put(sc, f"B{row}", f"={ref['cap']}", fmt="#,##0")
        put(sc, f"C{row}", f"={ref['revpc']}", fmt=USD)
        put(sc, f"D{row}", f"={ref['contrib']}", fmt=USD)
        put(sc, f"E{row}", f"={ref['fixedc']}", fmt=USD)
        put(sc, f"F{row}", f"={ref['occ']}", fmt=PCT)
        put(sc, f"G{row}", f"={ref['startup']}", fmt=USD)
    t1, t2 = 21, 20 + len(refs)
    put(sc, "A4", "INPUTS", bold=True, fill=SECTION)
    put(sc, "A5", f"Number of {unit}s you want to serve")
    put(sc, "B5", float(max(1, round(ordered[0].capacity))), fmt="#,##0", fill=INPUT, bold=True)
    put(sc, "A6", "Operating model")
    put(sc, "B6", safe(ordered[0].label), fill=INPUT, bold=True)
    sc.merge_cells("B6:H6")
    dv = DataValidation(type="list", formula1=f"=$A${t1}:$A${t2}", allow_blank=False)
    sc.add_data_validation(dv)
    dv.add("B6")
    m = f"MATCH($B$6,$A${t1}:$A${t2},0)"
    put(sc, "A7", "Occupancy (model default; you can type over it)")
    put(sc, "B7", f"=INDEX($F${t1}:$F${t2},{m})", fmt=PCT, fill=INPUT)
    put(sc, "A9", "RESULTS (stabilized month)", bold=True, fill=SECTION)
    rows = [
        ("Units needed", f"=ROUNDUP($B$5/INDEX($B${t1}:$B${t2},{m}),0)", "#,##0"),
        (f"Billable {unit}s", "=$B$5*$B$7", NUM),
        ("Monthly revenue", f"=$B$11*INDEX($C${t1}:$C${t2},{m})", USD),
        ("Monthly expenses", "=$B$12-$B$14", USD),
        ("MONTHLY NET INCOME", f"=$B$11*INDEX($D${t1}:$D${t2},{m})-$B$10*INDEX($E${t1}:$E${t2},{m})", USD),
        ("Net margin", "=IF($B$12=0,0,$B$14/$B$12)", PCT),
        ("Annual net income", "=$B$14*12", USD),
        ("One-time startup costs (all units)", f"=$B$10*INDEX($G${t1}:$G${t2},{m})", USD),
    ]
    for i, (lab, fml, fmt) in enumerate(rows):
        put(sc, f"A{10 + i}", lab, bold=i == 4)
        put(sc, f"B{10 + i}", fml, fmt=fmt, bold=True, fill=TOTAL)
    st = t2 + 3
    put(sc, f"A{st}", "NET INCOME AT DIFFERENT SIZES (selected model)", bold=True, fill=SECTION)
    header_row(sc, st + 1, ["Units", f"{unit.title()}s", "Monthly revenue", "Monthly net", "Annual net",
                            "Net margin"])
    for k, units in enumerate((1, 2, 3, 4, 5, 10)):
        row = st + 2 + k
        put(sc, f"A{row}", units, fmt="0")
        put(sc, f"B{row}", f"=A{row}*INDEX($B${t1}:$B${t2},{m})", fmt="#,##0")
        put(sc, f"C{row}", f"=B{row}*$B$7*INDEX($C${t1}:$C${t2},{m})", fmt=USD)
        put(sc, f"D{row}", f"=B{row}*$B$7*INDEX($D${t1}:$D${t2},{m})-A{row}*INDEX($E${t1}:$E${t2},{m})",
            fmt=USD, bold=True)
        put(sc, f"E{row}", f"=D{row}*12", fmt=USD)
        put(sc, f"F{row}", f"=IF(C{row}=0,0,D{row}/C{row})", fmt=PCT)
    put(sc, f"A{st + 9}", ("Each added unit carries its own staffing, rent and fixed costs, so this is conservative: "
                           "operators often share an administrator or office across units, which raises margin."),
        italic=True, wrap=True, color="595959")
    sc.merge_cells(f"A{st + 9}:F{st + 9}")
    sc.row_dimensions[st + 9].height = 30

    # ---- Rate matrix
    rm = wb.create_sheet("Rate Matrix")
    rm.sheet_view.showGridLines = False
    for col, w in zip("ABCDEFGH", (26, 14, 46, 14, 16, 14, 50, 40)):
        rm.column_dimensions[col].width = w
    put(rm, "A1", f"{d['state']} — Published rates used in this workbook", bold=True, size=14, color=GREEN)
    header_row(rm, 3, ["Payer", "Code", "Service", "Rate", "Unit", "Effective", "Notes", "Source"])
    for i, rt in enumerate(d.get("rates", [])):
        row = 4 + i
        put(rm, f"A{row}", rt.get("payer", ""))
        put(rm, f"B{row}", rt.get("code", ""))
        put(rm, f"C{row}", rt.get("service", ""), wrap=True)
        put(rm, f"D{row}", rt.get("rate"), fmt=USD2)
        put(rm, f"E{row}", rt.get("unit", ""))
        put(rm, f"F{row}", rt.get("effective", ""))
        put(rm, f"G{row}", rt.get("notes", ""), wrap=True)
        put(rm, f"H{row}", src_label(sources, rt.get("source_id")), italic=True, color="595959", wrap=True)

    # ---- Instructions
    ins = wb.create_sheet("Instructions", 0)
    ins.sheet_view.showGridLines = False
    ins.column_dimensions["A"].width = 120
    lines = [
        (f"{d['state']} {d['state_program_name']} — Pro Forma P&L", True, 14),
        (f"Prepared by Care Licensing Solutions, {d.get('as_of', '')}. Verified, sourced inputs only.", False, 10),
        ("", False, 10),
        ("HOW TO USE THIS WORKBOOK", True, 11),
        ("1. Start on 'Configurations'. It compares every operating model side by side, most profitable first.", False, 10),
        ("   Use 'Scale It' to type in how many residents or clients you want and see the result instantly.", False, 10),
        ("2. Open a 'P&L' tab to see month-by-month Year 1 (with ramp-up) and the stabilized month.", False, 10),
        ("3. Change any yellow cell (rates, wages, hours, rent, occupancy, ramp). Every total recalculates.", False, 10),
        ("4. Watch 'Cumulative net income' — the month it turns positive is your payback point.", False, 10),
        ("5. Break-even census and occupancy are at the bottom of each P&L tab.", False, 10),
        ("", False, 10),
        ("COLOR LEGEND", True, 11),
        ("Yellow = input you can edit · Light blue = computed total · Grey italics = source / note", False, 10),
        ("", False, 10),
        ("WHAT THIS WORKBOOK DOES NOT INCLUDE", True, 11),
        ("Startup capital (see the report's startup cost table), debt service, owner draws and income taxes. "
         "Add them before using this for financing.", False, 10),
        ("", False, 10),
        ("VERIFY BEFORE RELYING ON IT FOR FINANCING", True, 11),
        ("Rates and fees change. Every input lists its source on the 'Sources' tab — confirm current values "
         "with the agencies listed in your Licensing Checklist.", False, 10),
    ]
    for i, (txt, bold, size) in enumerate(lines, start=1):
        put(ins, f"A{i}", txt, bold=bold, size=size, wrap=True, color=GREEN if size > 10 else "000000")

    # ---- Sources
    so = wb.create_sheet("Sources")
    so.sheet_view.showGridLines = False
    for col, w in zip("ABCDE", (7, 60, 34, 70, 12)):
        so.column_dimensions[col].width = w
    put(so, "A1", "Sources", bold=True, size=14, color=GREEN)
    header_row(so, 3, ["ID", "Title", "Publisher", "URL", "Accessed"])
    for i, s in enumerate(d["sources"]):
        row = 4 + i
        put(so, f"A{row}", s["id"])
        put(so, f"B{row}", s.get("title", ""), wrap=True)
        put(so, f"C{row}", s.get("publisher", ""), wrap=True)
        c = put(so, f"D{row}", s.get("url", ""), color="1155CC")
        if s.get("url"):
            c.hyperlink = s["url"]
        put(so, f"E{row}", s.get("accessed", ""))

    wb.active = 1  # open on Configurations
    wb.save(path)
    return ordered

"""Market Research Report PDF (Oklahoma standard): cover, contents, Sections 1–10 with verified
numbers and inline source links, Section 8 built from the shared financial model, Appendices A–D."""
from __future__ import annotations

import html
import re

import markdown

from model import evaluate, opex_for, outlook, rank, startup_items
from pnl import src_ids

GREEN = "#1F4E3D"
ACCENT = "#417a5a"

SECTIONS = [
    ("executive_summary", "Executive Summary"),
    ("service_model", "Service Model & Regulatory Framework"),
    ("licensing_pathway", "Licensing & Certification Pathway"),
    ("reimbursement", "Reimbursement & Funding"),
    ("demand", "Referral Pipeline & Demand"),
    ("operations", "Program Operations"),
    ("market_conditions", "Market Conditions"),
    ("financial_narrative", "Startup Financial Analysis"),
    ("risks", "Risks & Considerations"),
    ("recommendations", "Strategic Recommendations"),
]

CSS = f"""
@page {{ size: Letter; margin: 0.8in 0.75in 0.8in 0.75in;
  @top-right {{ content: string(doctitle); font-size: 8pt; color: #777; }}
  @bottom-left {{ content: "Care Licensing Solutions"; font-size: 8pt; color: {ACCENT}; }}
  @bottom-right {{ content: "Page " counter(page); font-size: 8pt; color: #777; }} }}
@page cover {{ margin: 0; @top-right {{ content: none; }} @bottom-left {{ content: none; }}
  @bottom-right {{ content: none; }} }}
body {{ font-family: "Liberation Sans", Arial, "DejaVu Sans", sans-serif; font-size: 10pt; line-height: 1.45;
  color: #222; }}
.doctitle {{ string-set: doctitle content(); display: none; }}
.cover {{ page: cover; height: 11in; background: {GREEN}; color: white; padding: 2.2in 0.9in 0 0.9in;
  box-sizing: border-box; page-break-after: always; }}
.cover .state {{ font-size: 40pt; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }}
.cover .prog {{ font-size: 22pt; margin-top: 8pt; }}
.cover .sub {{ font-size: 14pt; margin-top: 6pt; color: #cfe3d8; }}
.cover .meta {{ margin-top: 2.4in; font-size: 10pt; color: #cfe3d8; border-top: 1px solid #6f9f86;
  padding-top: 10pt; }}
h1 {{ color: {GREEN}; font-size: 18pt; border-bottom: 2px solid {ACCENT}; padding-bottom: 4pt;
  page-break-before: always; margin-top: 0; }}
h1.first {{ page-break-before: auto; }}
h2 {{ color: {ACCENT}; font-size: 12.5pt; margin: 14pt 0 4pt; }}
h3 {{ color: {ACCENT}; font-size: 11pt; margin: 10pt 0 3pt; }}
p {{ margin: 0 0 7pt; }}
ul, ol {{ margin: 0 0 7pt 0; padding-left: 18pt; }}
li {{ margin-bottom: 2pt; }}
table {{ border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 8.6pt;
  page-break-inside: auto; }}
tr {{ page-break-inside: avoid; }}
th {{ background: {GREEN}; color: white; text-align: left; padding: 4pt 5pt; font-weight: bold; }}
td {{ border-bottom: 1px solid #d9d9d9; padding: 3.5pt 5pt; vertical-align: top; }}
tr:nth-child(even) td {{ background: #f4f8f6; }}
td.num, th.num {{ text-align: right; }}
td.num {{ white-space: nowrap; }}
table.wide {{ font-size: 7.6pt; table-layout: fixed; }}
table.wide td:first-child, table.wide th:first-child {{ width: 26%; }}
table.wide th {{ padding: 3pt 3pt; }} table.wide td {{ padding: 3pt 3pt; }}
tr.best td {{ background: #e3f1e8 !important; font-weight: bold; }}
.callout {{ background: #eef6f1; border-left: 4px solid {ACCENT}; padding: 8pt 10pt; margin: 8pt 0 10pt; }}
.warn {{ background: #fff6e0; border-left: 4px solid #d9a300; padding: 8pt 10pt; margin: 8pt 0 10pt; }}
a.cite {{ color: {ACCENT}; text-decoration: none; font-size: 8pt; vertical-align: super; }}
a {{ color: #1155cc; }}
.toc a {{ color: #222; text-decoration: none; }}
.toc li {{ list-style: none; margin: 3pt 0; }}
.toc a::after {{ content: leader('.') target-counter(attr(href), page); }}
.small {{ font-size: 8.4pt; color: #555; }}
.src td {{ font-size: 7.8pt; word-break: break-all; }}
"""


def esc(x) -> str:
    return html.escape("" if x is None else str(x))


def money(x: float, cents: bool = False) -> str:
    if x is None:
        return "–"
    s = f"${abs(x):,.2f}" if cents else f"${abs(x):,.0f}"
    return f"({s})" if x < 0 else s


def pct(x) -> str:
    return "–" if x is None else f"{x:.0%}"


def cite_links(text: str, valid: set[str]) -> str:
    """Turn [S3] / [S3][S5] / [S3, S5] into superscript links to Appendix D."""
    def repl(m):
        ids = [i.strip() for i in re.split(r"[,;]\s*", m.group(1))]
        out = []
        for i in ids:
            if i in valid:
                out.append(f'<a class="cite" href="#src-{i}">[{i}]</a>')
            else:
                out.append(f"[{esc(i)}]")
        return "".join(out)
    return re.sub(r"\[(S\d+(?:\s*[,;]\s*S\d+)*)\]", repl, text)


def md(text: str, valid: set[str]) -> str:
    out = markdown.markdown(text or "", extensions=["tables", "sane_lists"])
    out = re.sub(r"<h1>(.*?)</h1>", r"<h3>\1</h3>", out)
    out = re.sub(r"<h2>(.*?)</h2>", r"<h3>\1</h3>", out)
    return cite_links(out, valid)


def cite_for(sid, valid) -> str:
    return cite_links("".join(f"[{i}]" for i in src_ids(sid)), valid)


def table(headers, rows, num_cols=(), row_classes=None) -> str:
    th = "".join(f'<th class="{"num" if i in num_cols else ""}">{h}</th>' for i, h in enumerate(headers))
    body = []
    for ri, r in enumerate(rows):
        cls = f' class="{row_classes[ri]}"' if row_classes and row_classes[ri] else ""
        body.append(f"<tr{cls}>" + "".join(
            f'<td class="{"num" if i in num_cols else ""}">{c}</td>' for i, c in enumerate(r)) + "</tr>")
    return f"<table><thead><tr>{th}</tr></thead><tbody>{''.join(body)}</tbody></table>"


def financial_section(d: dict, valid: set[str]) -> str:
    fm = d["financial_model"]
    cfgs = {c["id"]: c for c in fm["configurations"]}
    ordered = rank(evaluate(fm))
    occ = fm["occupancy"]
    unit = fm.get("capacity_unit", "client")
    parts = []

    best = ordered[0]
    bo = outlook(fm, cfgs[best.id], best)
    if best.results["default"]["net"] > 0:
        pay = (f"recovers its startup costs by month {bo['payback_month']}" if bo["payback_month"]
               else "recovers its startup costs after month 36 at the stabilized pace")
        parts.append(
            f'<div class="callout"><b>Path to profit.</b> The strongest model is <b>{esc(best.label)}</b>. '
            f"At {pct(occ['default'])} occupancy it nets about <b>{money(best.results['default']['net'])} per "
            f"month</b> ({pct(best.results['default']['margin'])} margin) once full, breaks even at about "
            f"{pct(best.breakeven_occupancy)} occupancy, turns a monthly profit in month "
            f"{bo['first_profitable_month']} and {pay}. Plan for about <b>{money(bo['cash_needed'])}</b> in total "
            f"cash (startup costs plus ramp-up losses).</div>")
    else:
        parts.append('<div class="warn"><b>No configuration modeled is profitable at the default occupancy with '
                     "current published rates.</b> Section 10 sets out the size, price or payer mix required.</div>")

    parts.append("<h2>8.1 Configurations compared (stabilized month)</h2>")
    parts.append(
        f"<p>Each row is a complete operating model using the verified rates, wages and costs in this report, "
        f"at {pct(occ['default'])} default occupancy. The P&amp;L workbook has a live tab for each so you can "
        "change any input.</p>")
    rows, classes = [], []
    for cr in ordered:
        m = cr.results["default"]
        o = outlook(fm, cfgs[cr.id], cr)
        rows.append([
            esc(cr.label), f"{cr.capacity:g}", money(cr.rev_per_client), money(m["revenue"]), money(m["expenses"]),
            money(m["net"]), pct(m["margin"]),
            ("Above capacity" if (cr.breakeven_occupancy or 0) > 1 else pct(cr.breakeven_occupancy))
            if cr.breakeven_occupancy is not None else "Not reachable",
            str(o["first_profitable_month"] or "&gt;36"), money(o["cash_needed"]),
        ])
        classes.append("best" if cr is best and m["net"] > 0 else "")
    parts.append(table(["Configuration", "Capacity", f"Revenue / {unit} / mo", "Revenue / mo", "Expenses / mo",
                        "Net / mo", "Margin", "Break-even occupancy", "First profit month", "Total cash needed"],
                       rows, num_cols=range(1, 10), row_classes=classes).replace("<table>", '<table class="wide">', 1))

    parts.append("<h2>8.2 Occupancy sensitivity</h2>")
    rows = []
    for cr in ordered:
        rows.append([esc(cr.label)] + [money(cr.results[k]["net"]) if k in cr.results else "–"
                                       for k in ("conservative", "default", "optimistic")])
    parts.append(table(["Configuration", f"Conservative ({pct(occ.get('conservative'))})",
                        f"Default ({pct(occ['default'])})", f"Optimistic ({pct(occ.get('optimistic'))})"],
                       rows, num_cols=(1, 2, 3)))
    if occ.get("rationale"):
        parts.append(f'<p class="small">Occupancy basis: {cite_links(esc(occ["rationale"]), valid)} '
                     f'{cite_for(occ.get("source_id"), valid)}</p>')

    parts.append(f"<h2>8.3 Lead model in detail: {esc(best.label)}</h2>")
    cfg = cfgs[best.id]
    rev_rows = [[esc(l["name"]), esc(l.get("payer", "")), money(float(l["rate"]), True), esc(l.get("unit", "")),
                 f"{float(l.get('units_per_client_month', 1)):g}", pct(float(l.get("share_of_clients", 1))),
                 cite_for(l.get("source_id"), valid)] for l in cfg["revenue_lines"]]
    parts.append("<h3>Revenue</h3>" + table(["Line", "Payer", "Rate", "Unit", "Units / mo", "Share", "Source"],
                                            rev_rows, num_cols=(2, 4, 5)))
    st_rows = []
    for s in cfg.get("staffing", []):
        amt = float(s.get("amount") or 0)
        basis = {"annual_salary": f"{money(amt)} / yr", "hours_per_month": f"{amt:,.0f} hrs / mo",
                 "hours_per_client_month": f"{amt:g} hrs / {unit} / mo"}[s["basis"]]
        st_rows.append([esc(s["role"]), money(float(s["wage_hourly"]), True) if s.get("wage_hourly") else "–",
                        basis, esc(s.get("cite", "")), cite_for(s.get("wage_source_id"), valid)])
    parts.append("<h3>Staffing</h3>" + table(["Role", "Wage", "Coverage", "Rule", "Wage source"], st_rows,
                                             num_cols=(1,)))
    op_rows = [[esc(o["item"]), money(float(o["monthly"])), "per " + unit if o.get("basis") == "per_client"
                else "fixed", cite_for(o.get("source_id"), valid) or '<span class="small">Operator estimate</span>']
               for o in opex_for(fm, cfg)]
    parts.append("<h3>Operating expenses (monthly)</h3>" + table(["Expense", "Monthly", "Basis", "Source"], op_rows,
                                                                 num_cols=(1,)))
    pb = fm.get("payroll_burden", {})
    parts.append(f'<p class="small">Payroll burden: taxes {pct(pb.get("payroll_tax_pct"))}, workers\' comp '
                 f'{pct(pb.get("workers_comp_pct"))}, benefits/leave {pct(pb.get("benefits_pct"))}. '
                 f'{cite_links(esc(pb.get("notes", "")), valid)}</p>')

    parts.append("<h3>Ramp-up: first 36 months</h3>")
    rows = []
    for r in bo["rows"]:
        if r["month"] in (1, 2, 3, 4, 5, 6, 9, 12, 18, 24, 30, 36):
            rows.append([str(r["month"]), f"{r['clients']:g}", money(r["revenue"]), money(r["expenses"]),
                         money(r["net"]), money(r["cumulative"])])
    parts.append(table(["Month", f"{unit.title()}s", "Revenue", "Expenses", "Net", "Cumulative"], rows,
                       num_cols=range(0, 6)))
    yn = bo["year_net"]
    parts.append(f"<p>Year 1 net {money(yn[0])}; Year 2 {money(yn[1])}; Year 3 {money(yn[2])}.</p>")

    parts.append("<h2>8.4 Startup costs for the lead model</h2>")
    rows = []
    for s in startup_items(fm, cfg):
        note = ""
        if s.get("category") == "working_capital":
            note = " (shown for reference; the ramp-up deficit above replaces this line)"
        elif s.get("category") == "required_reserve":
            note = " (required reserve: cash you must show)"
        rows.append([esc(s["item"]) + note, money(float(s.get("low", 0) or 0)), money(float(s.get("high", 0) or 0)),
                     "–" if s.get("category") else money(s["amount"]), cite_for(s.get("source_id"), valid)])
    rows.append(["<b>One-time startup total</b>", "", "", f"<b>{money(bo['startup'])}</b>", ""])
    rows.append(["Largest ramp-up deficit", "", "", money(bo["operating_deficit"]), ""])
    if bo["required_reserve"]:
        rows.append(["Required reserve", "", "", money(bo["required_reserve"]), ""])
    rows.append(["<b>Total cash needed</b>", "", "", f"<b>{money(bo['cash_needed'])}</b>", ""])
    parts.append(table(["Item", "Low", "High", "This model", "Source"], rows, num_cols=(1, 2, 3)))
    parts.append('<p class="small">Startup ranges are scaled to the size of the configuration. Excludes debt '
                 "service, owner draws and income taxes.</p>")
    return "".join(parts)


def build_report(d: dict, path: str) -> None:
    from weasyprint import HTML

    valid = {s["id"] for s in d["sources"]}
    title = d.get("report_title") or f"{d['state']} {d['program']} — Provider Market Research Report"
    secs = d["sections"]
    h = [f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body>",
         f'<div class="doctitle">{esc(title)}</div>']
    h.append(f'<div class="cover"><div class="state">{esc(d["state"])}</div>'
             f'<div class="prog">{esc(d["state_program_name"])}</div>'
             f'<div class="sub">Provider Market Research Report</div>'
             f'<div class="meta">Prepared by Care Licensing Solutions · Research current as of {esc(d.get("as_of", ""))}'
             f'<br>{len(d["sources"])} sources · every figure cited · verified by an independent fact-check</div></div>')
    # Contents
    h.append('<h1 class="first">Contents</h1><ul class="toc">')
    for i, (_, name) in enumerate(SECTIONS, 1):
        h.append(f'<li><a href="#sec{i}">Section {i}. {name}</a></li>')
    for a, name in (("A", "Rate Schedule"), ("B", "Key Contacts"), ("C", "Regulatory References"),
                    ("D", "Sources")):
        h.append(f'<li><a href="#app{a}">Appendix {a}. {name}</a></li>')
    h.append("</ul>")
    h.append('<div class="callout small">How to read this report: bracketed numbers such as '
             '<a class="cite" href="#app' + 'D">[S1]</a> link to the source list in Appendix D. Where a fact could '
             'not be verified from a public source it is left out and listed under "What this report does not '
             'claim" in Section 1.</div>')

    for i, (key, name) in enumerate(SECTIONS, 1):
        h.append(f'<h1 id="sec{i}">Section {i}. {name}</h1>')
        if key == "executive_summary":
            h.append(f"<h2>{i}.1 Opportunity snapshot</h2>")
            h.append(md(secs.get(key, ""), valid))
            h.append(f"<h2>{i}.2 Key numbers (verified)</h2>")
            rows = [[esc(k["metric"]), cite_links(esc(k["value"]), valid), esc(k.get("as_of", "")),
                     cite_for(k.get("source_ids") or k.get("source_id"), valid)] for k in d.get("key_numbers", [])]
            h.append(table(["Metric", "Value", "As of", "Source"], rows))
            fm = d["financial_model"]
            best = rank(evaluate(fm))[0]
            m = best.results["default"]
            if m["net"] > 0:
                h.append(f'<div class="callout"><b>Bottom line:</b> {esc(best.label)} nets about '
                         f"{money(m['net'])} per month at {pct(fm['occupancy']['default'])} occupancy "
                         f"(break-even {pct(best.breakeven_occupancy)}). Details in Section 8.</div>")
            if d.get("not_claimed"):
                h.append(f"<h2>{i}.3 What this report does not claim</h2><ul>")
                h.extend(f"<li>{cite_links(esc(x), valid)}</li>" for x in d["not_claimed"])
                h.append("</ul>")
        elif key == "financial_narrative":
            h.append(financial_section(d, valid))
            h.append(f"<h2>{i}.5 How the model is built</h2>")
            h.append(md(secs.get(key, ""), valid))
            h.append('<p class="small">If any figure in the narrative above differs from the tables in 8.1–8.4, '
                     "the tables (generated directly from the model and the P&amp;L workbook) govern.</p>")
        else:
            h.append(md(secs.get(key, ""), valid))

    # Appendices
    h.append('<h1 id="appA">Appendix A. Rate Schedule</h1>')
    rows = [[esc(r.get("payer", "")), esc(r.get("code", "")), esc(r.get("service", "")),
             money(float(r["rate"]), True) if isinstance(r.get("rate"), (int, float)) else esc(r.get("rate")),
             esc(r.get("unit", "")), esc(r.get("effective", "")), cite_for(r.get("source_id"), valid)]
            for r in d.get("rates", [])]
    h.append(table(["Payer", "Code", "Service", "Rate", "Unit", "Effective", "Source"], rows, num_cols=(3,)))
    notes = [r for r in d.get("rates", []) if r.get("notes")]
    if notes:
        h.append("<h3>Rate notes</h3><ul class='small'>")
        h.extend(f"<li><b>{esc(r.get('service', ''))}</b>: {cite_links(esc(r['notes']), valid)}</li>" for r in notes)
        h.append("</ul>")

    h.append('<h1 id="appB">Appendix B. Key Contacts</h1>')
    rows = [[f"<b>{esc(g['name'])}</b>", esc(g.get("role", "")),
             "<br>".join(esc(x) for x in [g.get("phone"), g.get("email")] if x)
             + (f'<br><a href="{esc(g["url"])}">{esc(g["url"])}</a>' if g.get("url") else ""),
             cite_for(g.get("source_id"), valid)] for g in d.get("regulators", [])]
    rows += [[f"<b>{esc(c['name'])}</b>", esc(c.get("role", "")), esc(c.get("contact", "")), ""]
             for c in d.get("contacts", [])]
    h.append(table(["Organization", "Role", "Contact", "Source"], rows))

    h.append('<h1 id="appC">Appendix C. Regulatory References</h1>')
    rows = [[f"<b>{esc(g['cite'])}</b>", esc(g.get("title", "")),
             f'<a href="{esc(g.get("url", ""))}">{esc(g.get("url", ""))}</a>', cite_for(g.get("source_id"), valid)]
            for g in d.get("regulations", [])]
    h.append(table(["Citation", "Subject", "Link", "Source"], rows))

    h.append('<h1 id="appD">Appendix D. Sources</h1>')
    h.append('<p class="small">Official = government agency, statute or regulation, or federal data. Secondary = '
             "trade association or industry survey, used only where no official figure exists.</p>")
    rows = [[f'<span id="src-{esc(s["id"])}"><b>{esc(s["id"])}</b></span>', esc(s.get("title", "")),
             esc(s.get("publisher", "")), esc(s.get("type", "")),
             f'<a href="{esc(s.get("url", ""))}">{esc(s.get("url", ""))}</a>', esc(s.get("accessed", ""))]
            for s in d["sources"]]
    h.append(table(["ID", "Title", "Publisher", "Type", "URL", "Accessed"], rows).replace("<table>",
                                                                                          '<table class="src">'))
    h.append("<p class='small'>Prepared by Care Licensing Solutions for planning purposes. This report is not "
             "legal, tax or financial advice. Confirm current requirements with the agencies in Appendix B before "
             "applying or committing capital.</p>")
    h.append("</body></html>")
    HTML(string="".join(h)).write_pdf(path)

"""Policy & Procedure Manual renderer: manual JSON -> editable DOCX (+ PDF via LibreOffice).

Manual JSON (content-factory/manuals/<slug>.json):
{
  "bundle_slug", "state", "program", "state_program_name", "as_of",
  "front_matter": {"purpose": md, "how_to_use": md, "regulatory_framework": md},
  "citations": [{"id": "C1", "cite": "...", "title": "...", "url": "...", "requirement": "...", "verified": true}],
  "policies": [{"id": "ADM-01", "category": "...", "title": "...", "citations": ["C1"], "federal": ["45 CFR 164.530"],
                "purpose": "...", "policy": "...", "definitions": [{"term": "...", "definition": "..."}],
                "procedures": ["..."], "responsibilities": [{"role": "...", "duty": "..."}],
                "documentation": ["..."], "related": ["ADM-02"]}],
  "forms": [{"name": "...", "purpose": "...", "policy_ids": ["ADM-01"]}]
}
"""
from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Inches

GREEN = RGBColor(0x1F, 0x4E, 0x3D)
ACCENT = RGBColor(0x41, 0x7A, 0x5A)
GREY = RGBColor(0x59, 0x59, 0x59)
AGENCY = "[AGENCY NAME]"


def _shade(cell, hex_fill: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tcPr.append(shd)


def _page_number_field(par):
    run = par.add_run()
    for kind, text in (("begin", None), (None, "PAGE"), ("end", None)):
        if kind:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), kind)
            run._r.append(el)
        else:
            instr = OxmlElement("w:instrText")
            instr.set(qn("xml:space"), "preserve")
            instr.text = text
            run._r.append(instr)


def _md_inline(par, text: str, size=10.5, color=None):
    """Very small markdown: **bold** and plain text."""
    for i, chunk in enumerate(re.split(r"(\*\*[^*]+\*\*)", text or "")):
        if not chunk:
            continue
        bold = chunk.startswith("**") and chunk.endswith("**")
        r = par.add_run(chunk[2:-2] if bold else chunk)
        r.bold = bold
        r.font.size = Pt(size)
        if color:
            r.font.color.rgb = color


def _md_block(doc, text: str):
    for block in re.split(r"\n\s*\n", (text or "").strip()):
        lines = block.strip().splitlines()
        if all(re.match(r"^\s*[-*•]\s+", l) for l in lines if l.strip()):
            for l in lines:
                p = doc.add_paragraph(style="List Bullet")
                _md_inline(p, re.sub(r"^\s*[-*•]\s+", "", l))
        elif all(re.match(r"^\s*\d+[.)]\s+", l) for l in lines if l.strip()):
            for n, l in enumerate(lines, 1):
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.35)
                p.paragraph_format.first_line_indent = Inches(-0.3)
                p.add_run(f"{n}.  ").bold = True
                _md_inline(p, re.sub(r"^\s*\d+[.)]\s+", "", l))
        elif lines and lines[0].startswith("#"):
            doc.add_heading(lines[0].lstrip("#").strip(), level=3)
            if len(lines) > 1:
                _md_block(doc, "\n".join(lines[1:]))
        else:
            p = doc.add_paragraph()
            _md_inline(p, " ".join(l.strip() for l in lines))


def _styles(doc):
    st = doc.styles
    st["Normal"].font.name = "Arial"
    st["Normal"].font.size = Pt(10.5)
    st["Normal"]._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    for name, size, color in (("Heading 1", 18, GREEN), ("Heading 2", 14, GREEN), ("Heading 3", 11.5, ACCENT)):
        s = st[name]
        s.font.name = "Arial"
        s.font.size = Pt(size)
        s.font.bold = True
        s.font.color.rgb = color
    for sec in doc.sections:
        sec.left_margin = sec.right_margin = Inches(1)
        sec.top_margin = sec.bottom_margin = Inches(0.9)


def _footer(doc, title: str):
    sec = doc.sections[0]
    p = sec.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(f"{AGENCY} — {title} — Page ")
    r.font.size = Pt(8)
    r.font.color.rgb = GREY
    _page_number_field(p)
    hp = sec.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hr = hp.add_run("Confidential — internal policy document")
    hr.font.size = Pt(8)
    hr.font.color.rgb = GREY


def _kv_table(doc, rows, widths=(1.7, 4.8)):
    t = doc.add_table(rows=0, cols=2)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for k, v in rows:
        c = t.add_row().cells
        c[0].width, c[1].width = Inches(widths[0]), Inches(widths[1])
        _shade(c[0], "E8F1EC")
        c[0].paragraphs[0].add_run(k).bold = True
        c[1].paragraphs[0].add_run(v or "")
        for cell in c:
            for r in cell.paragraphs[0].runs:
                r.font.size = Pt(9.5)
    return t


def build_manual(m: dict, docx_path: str, pdf: bool = True) -> None:
    cites = {c["id"]: c for c in m.get("citations", [])}
    title = f"{m['state']} {m['program']} Policy & Procedure Manual"
    doc = Document()
    _styles(doc)
    _footer(doc, title)

    # ---- Cover
    for _ in range(5):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(AGENCY)
    r.bold, r.font.size, r.font.color.rgb = True, Pt(28), GREEN
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Policy and Procedure Manual")
    r.font.size, r.font.color.rgb = Pt(22), ACCENT
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(f"{m['state']} — {m.get('state_program_name') or m['program']}")
    r.font.size = Pt(14)
    for _ in range(6):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(f"Effective date: [DATE]     Version 1.0\nPrepared with Care Licensing Solutions — rules current as of "
                  f"{m.get('as_of', '')}. Review against current regulations before adoption.")
    r.font.size, r.font.color.rgb = Pt(9), GREY
    doc.add_page_break()

    # ---- Adoption page and revision log
    doc.add_heading("Adoption and Approval", level=1)
    doc.add_paragraph(f"This manual was adopted by the governing body of {AGENCY} and applies to all owners, "
                      "administrators, employees, contractors and volunteers. It is reviewed at least annually and "
                      "whenever a governing rule changes.")
    _kv_table(doc, [("Licensee / owner", "[NAME, TITLE]"), ("Administrator", "[NAME, LICENSE/CERTIFICATE #]"),
                    ("Address", "[ADDRESS]"), ("License / provider #", "[NUMBER]"),
                    ("Date adopted", "[DATE]"), ("Signature", "")])
    doc.add_heading("Revision History", level=2)
    t = doc.add_table(rows=1, cols=4)
    t.style = "Table Grid"
    for i, h in enumerate(("Version", "Date", "Policies changed", "Approved by")):
        c = t.rows[0].cells[i]
        _shade(c, "1F4E3D")
        rr = c.paragraphs[0].add_run(h)
        rr.bold, rr.font.color.rgb = True, RGBColor(0xFF, 0xFF, 0xFF)
    for row in (("1.0", "[DATE]", "Initial adoption", "[NAME]"), ("", "", "", ""), ("", "", "", "")):
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = v
    doc.add_page_break()

    # ---- Contents
    doc.add_heading("Contents", level=1)
    doc.add_paragraph("Introduction and Regulatory Framework")
    cats: list[str] = []
    for pol in m["policies"]:
        if pol.get("category") not in cats:
            cats.append(pol.get("category"))
    for i, cat in enumerate(cats, 1):
        p = doc.add_paragraph()
        p.add_run(f"Section {i}. {cat}").bold = True
        for pol in [x for x in m["policies"] if x.get("category") == cat]:
            q = doc.add_paragraph(f"{pol['id']}  {pol['title']}")
            q.paragraph_format.left_indent = Inches(0.3)
            q.paragraph_format.space_after = Pt(0)
    doc.add_paragraph("Appendix A. Official Requirements Crosswalk")
    doc.add_paragraph("Appendix B. Regulatory Crosswalk")
    doc.add_paragraph("Appendix C. Forms and Records Referenced")
    doc.add_page_break()

    # ---- Introduction
    fm = m.get("front_matter", {})
    doc.add_heading("Introduction and Regulatory Framework", level=1)
    doc.add_heading("Purpose of this manual", level=2)
    _md_block(doc, fm.get("purpose", ""))
    doc.add_heading("How to use and customize this manual", level=2)
    _md_block(doc, fm.get("how_to_use", ""))
    doc.add_heading("Governing rules", level=2)
    _md_block(doc, fm.get("regulatory_framework", ""))

    # ---- Policies
    for i, cat in enumerate(cats, 1):
        doc.add_page_break()
        doc.add_heading(f"Section {i}. {cat}", level=1)
        first = True
        for pol in [x for x in m["policies"] if x.get("category") == cat]:
            if not first:
                doc.add_page_break()
            first = False
            doc.add_heading(f"{pol['id']}  {pol['title']}", level=2)
            state_cites = "; ".join(cites[c]["cite"] for c in pol.get("citations", []) if c in cites) or "—"
            _kv_table(doc, [("Policy number", pol["id"]), ("Effective date", "[DATE]"),
                            ("Last reviewed", "[DATE]"), ("Applies to", pol.get("applies_to") or "All staff"),
                            (f"{m['state']} rules", state_cites),
                            ("Federal / other", "; ".join(pol.get("federal") or []) or "—"),
                            ("Official checklist items", ", ".join(pol.get("covers") or []) or "—")])
            doc.add_heading("Purpose", level=3)
            _md_block(doc, pol.get("purpose", ""))
            doc.add_heading("Policy", level=3)
            _md_block(doc, pol.get("policy", ""))
            if pol.get("definitions"):
                doc.add_heading("Definitions", level=3)
                for d in pol["definitions"]:
                    p = doc.add_paragraph(style="List Bullet")
                    p.add_run(f"{d.get('term', '')}: ").bold = True
                    p.add_run(d.get("definition", ""))
            doc.add_heading("Procedures", level=3)
            for n, step in enumerate(pol.get("procedures", []), 1):
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.35)
                p.paragraph_format.first_line_indent = Inches(-0.3)
                p.paragraph_format.space_after = Pt(3)
                p.add_run(f"{n}.  ").bold = True
                _md_inline(p, re.sub(r"^\s*\d+[.)]\s*", "", step))
            if pol.get("responsibilities"):
                doc.add_heading("Responsibilities", level=3)
                for rsp in pol["responsibilities"]:
                    p = doc.add_paragraph(style="List Bullet")
                    p.add_run(f"{rsp.get('role', '')}: ").bold = True
                    p.add_run(rsp.get("duty", ""))
            if pol.get("documentation"):
                doc.add_heading("Documentation and records", level=3)
                for d in pol["documentation"]:
                    doc.add_paragraph(d, style="List Bullet")
            if pol.get("related"):
                p = doc.add_paragraph()
                r = p.add_run("Related policies: " + ", ".join(pol["related"]))
                r.italic, r.font.size, r.font.color.rgb = True, Pt(9), GREY

    # ---- Appendix A: official checklist / application items -> policies
    off = m.get("official") or {}
    doc.add_page_break()
    doc.add_heading("Appendix A. Official Requirements Crosswalk", level=1)
    docs = off.get("documents") or []
    if docs:
        doc.add_paragraph("The state reviews this manual against the official document(s) below. Each item is mapped "
                          "to the policy that satisfies it, in the document's own numbering.")
        for dd in docs:
            p = doc.add_paragraph(style="List Bullet")
            p.add_run(" ".join(x for x in [dd.get("form_number") or "", dd.get("title") or ""] if x)).bold = True
            extra = " — ".join(x for x in [dd.get("issuer") or "", f"version {dd['version']}" if dd.get("version") else "",
                                            dd.get("url") or ""] if x)
            if extra:
                p.add_run(f" ({extra})")
    if off.get("notes"):
        _md_block(doc, off["notes"])
    items = off.get("required_items") or []
    if items:
        t = doc.add_table(rows=1, cols=3)
        t.style = "Table Grid"
        for i, h in enumerate(("Item", "Official requirement", "Policies")):
            c = t.rows[0].cells[i]
            _shade(c, "1F4E3D")
            rr = c.paragraphs[0].add_run(h)
            rr.bold, rr.font.color.rgb = True, RGBColor(0xFF, 0xFF, 0xFF)
        for it in items:
            pols = [p["id"] for p in m["policies"] if it.get("item_id") in (p.get("covers") or [])]
            cells = t.add_row().cells
            cells[0].text = str(it.get("item_id", ""))
            cells[1].text = it.get("text", "")
            cells[2].text = ", ".join(pols) or "—"
            for cell in cells:
                for r in cell.paragraphs[0].runs:
                    r.font.size = Pt(8.5)
    else:
        doc.add_paragraph("No single official checklist was found for this license; Appendix B maps the governing "
                          "rules to the policies.")

    # ---- Appendix B: rule crosswalk
    doc.add_page_break()
    doc.add_heading("Appendix B. Regulatory Crosswalk", level=1)
    doc.add_paragraph(f"Each {m['state']} requirement below is addressed by the listed policies. Surveyors and "
                      "application reviewers often ask for this map.")
    t = doc.add_table(rows=1, cols=3)
    t.style = "Table Grid"
    for i, h in enumerate(("Rule", "What it requires", "Policies")):
        c = t.rows[0].cells[i]
        _shade(c, "1F4E3D")
        rr = c.paragraphs[0].add_run(h)
        rr.bold, rr.font.color.rgb = True, RGBColor(0xFF, 0xFF, 0xFF)
    for c in m.get("citations", []):
        pols = [p["id"] for p in m["policies"] if c["id"] in p.get("citations", [])]
        cells = t.add_row().cells
        cells[0].text = c["cite"]
        cells[1].text = c.get("requirement", "")
        cells[2].text = ", ".join(pols) or "—"
        for cell in cells:
            for r in cell.paragraphs[0].runs:
                r.font.size = Pt(8.5)
    doc.add_paragraph()
    doc.add_heading("Rule sources", level=2)
    for c in m.get("citations", []):
        if c.get("url"):
            p = doc.add_paragraph(style="List Bullet")
            r = p.add_run(f"{c['cite']} — {c.get('title', '')}: {c['url']}")
            r.font.size = Pt(8.5)

    # ---- Appendix B forms
    doc.add_page_break()
    doc.add_heading("Appendix C. Forms and Records Referenced", level=1)
    doc.add_paragraph("Create or obtain each form below before opening. State-issued forms must be the current "
                      "version from the regulator's website.")
    t = doc.add_table(rows=1, cols=3)
    t.style = "Table Grid"
    for i, h in enumerate(("Form / record", "Purpose", "Used in")):
        c = t.rows[0].cells[i]
        _shade(c, "1F4E3D")
        rr = c.paragraphs[0].add_run(h)
        rr.bold, rr.font.color.rgb = True, RGBColor(0xFF, 0xFF, 0xFF)
    for f in m.get("forms", []):
        cells = t.add_row().cells
        cells[0].text = f.get("name", "")
        cells[1].text = f.get("purpose", "")
        cells[2].text = ", ".join(f.get("policy_ids", []))
        for cell in cells:
            for r in cell.paragraphs[0].runs:
                r.font.size = Pt(8.5)

    doc.save(docx_path)
    if pdf:
        out = Path(docx_path)
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp, str(out)],
                           check=True, capture_output=True, timeout=300)
            shutil.move(str(Path(tmp) / (out.stem + ".pdf")), str(out.with_suffix(".pdf")))

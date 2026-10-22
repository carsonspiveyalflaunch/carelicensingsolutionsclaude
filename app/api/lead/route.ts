import { NextRequest, NextResponse } from "next/server";
import { saveLeadInGhl, GHL_FIELDS } from "@/lib/ghl";
import { PROGRAM_HEADLINE } from "@/lib/go-links";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCES = new Set(["footer", "agency-finder", "bundle-page"]);

// Website email capture → GoHighLevel contact (ALF Launch sub-account).
// Bundle-page leads get the CLS fields + `cls-followup`, which starts the
// existing CLS follow-up workflow and puts them under the reply assistant.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const source = typeof body.source === "string" && SOURCES.has(body.source) ? body.source : "footer";
  if (!EMAIL.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }
  // Honeypot: real visitors never fill this hidden field.
  if (body.company) return NextResponse.json({ ok: true });

  const firstName = typeof body.firstName === "string" ? body.firstName.slice(0, 60) : null;
  const tags = ["cls-site-lead", `cls-lead-${source}`];
  const customFields: { id: string; value: string }[] = [];

  const slug = typeof body.slug === "string" && /^[a-z]{2}-[a-z-]+$/.test(body.slug) ? body.slug : null;
  const state = typeof body.state === "string" ? body.state.slice(0, 40) : "";
  const program = typeof body.program === "string" ? body.program.slice(0, 80) : "";
  if (source === "bundle-page" && slug && state) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://carelicensingsolution.com";
    customFields.push(
      { id: GHL_FIELDS.bundleLink, value: `${site}/go/${slug}?utm_source=site&utm_campaign=lead` },
      { id: GHL_FIELDS.stateName, value: state },
      { id: GHL_FIELDS.stateCode, value: slug.slice(0, 2).toUpperCase() },
    );
    if (program) {
      customFields.push(
        { id: GHL_FIELDS.program, value: program },
        { id: GHL_FIELDS.programPhrase, value: (PROGRAM_HEADLINE[program] || program).toLowerCase() },
      );
    }
    tags.push("cls-followup");
  }

  const res = await saveLeadInGhl({ email, firstName, tags, customFields });
  console.log("Lead capture:", source, res.reason);
  // Never show the visitor an error for a CRM hiccup; it's logged above.
  return NextResponse.json({ ok: true });
}

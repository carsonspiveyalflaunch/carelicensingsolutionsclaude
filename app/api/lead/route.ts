import { NextRequest, NextResponse } from "next/server";
import { saveLeadInGhl, GHL_FIELDS } from "@/lib/ghl";
import { PROGRAM_HEADLINE, parseGoSlug } from "@/lib/go-links";
import { STATE_NAMES } from "@/lib/us-states";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCES = new Set(["footer", "agency-finder", "bundle-page", "chat"]);

// Website email capture → GoHighLevel contact (ALF Launch sub-account).
// Leads whose state + program we know (bundle page, or the chat assistant once
// it has both) get the CLS fields + `cls-followup`, which starts the existing
// CLS follow-up workflow and puts them under the GHL reply assistant.
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
  const phoneDigits = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  const phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : phoneDigits.length === 11 && phoneDigits.startsWith("1") ? `+${phoneDigits}` : null;
  const tags = ["cls-site-lead", `cls-lead-${source}`];
  const customFields: { id: string; value: string }[] = [];

  // slug like "tx-home-care" identifies both state and program.
  const slug = typeof body.slug === "string" && /^[a-z]{2}-[a-z-]+$/.test(body.slug) ? body.slug : null;
  const parsed = slug ? parseGoSlug(slug) : null;
  if (parsed) {
    const state = STATE_NAMES[parsed.code] || (typeof body.state === "string" ? body.state.slice(0, 40) : "");
    const program = parsed.program;
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://carelicensingsolution.com";
    customFields.push(
      { id: GHL_FIELDS.bundleLink, value: `${site}/go/${slug}?utm_source=site&utm_campaign=${source}` },
      { id: GHL_FIELDS.stateName, value: state },
      { id: GHL_FIELDS.stateCode, value: parsed.code },
      { id: GHL_FIELDS.program, value: program },
      { id: GHL_FIELDS.programPhrase, value: (PROGRAM_HEADLINE[program] || program).toLowerCase() },
    );
    tags.push("cls-followup");
  } else if (typeof body.stateCode === "string" && STATE_NAMES[body.stateCode]) {
    customFields.push(
      { id: GHL_FIELDS.stateName, value: STATE_NAMES[body.stateCode] },
      { id: GHL_FIELDS.stateCode, value: body.stateCode },
    );
  }

  const res = await saveLeadInGhl({ email, firstName, phone, tags, customFields });
  console.log("Lead capture:", source, res.reason);
  // Never show the visitor an error for a CRM hiccup; it's logged above.
  return NextResponse.json({ ok: true });
}

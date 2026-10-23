import { NextRequest, NextResponse } from "next/server";
import { saveLeadInGhl, sendSmsInGhl, GHL_FIELDS } from "@/lib/ghl";
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
  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const email = EMAIL.test(rawEmail) && rawEmail.length <= 200 ? rawEmail : null;
  const source = typeof body.source === "string" && SOURCES.has(body.source) ? body.source : "footer";
  const phoneDigits = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  const phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : phoneDigits.length === 11 && phoneDigits.startsWith("1") ? `+${phoneDigits}` : null;
  // The chat assistant may capture just a phone number; every other form needs an email.
  if (!email && !(source === "chat" && phone)) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }
  // Honeypot: real visitors never fill this hidden field.
  if (body.company) return NextResponse.json({ ok: true });

  const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 60) || null : null;
  const tags = ["cls-site-lead", `cls-lead-${source}`];
  let textLink: { url: string; what: string; state: string } | null = null;
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
    textLink = {
      url: `${site}/go/${slug}?utm_source=sms&utm_campaign=chat${body.promo === "LAUNCH20" ? "&code=LAUNCH20" : ""}`,
      what: (PROGRAM_HEADLINE[program] || program).replace(/^an? /, ""),
      state,
    };
  } else if (typeof body.stateCode === "string" && STATE_NAMES[body.stateCode]) {
    customFields.push(
      { id: GHL_FIELDS.stateName, value: STATE_NAMES[body.stateCode] },
      { id: GHL_FIELDS.stateCode, value: body.stateCode },
    );
  }

  // Visitor asked the chat assistant to text them their link: send it now.
  const wantsText = source === "chat" && phone && body.textLink === true;
  if (wantsText) tags.push("cls-chat-texted");
  const res = await saveLeadInGhl({ email, firstName, phone, tags, customFields });
  console.log("Lead capture:", source, res.reason);
  if (wantsText && res.contactId) {
    const hi = firstName ? `Hi ${firstName}, it's` : "Hi, it's";
    const msg = textLink
      ? `${hi} Carson's assistant at Care Licensing Solutions. Here's your ${textLink.state} ${textLink.what} bundle like you asked: ${textLink.url}\n\nQuestions? Just reply here. Reply STOP to opt out.`
      : `${hi} Carson's assistant at Care Licensing Solutions. Here's where to find your state's licensing bundle: ${process.env.NEXT_PUBLIC_SITE_URL || "https://carelicensingsolution.com"}/get-started\n\nQuestions? Just reply here. Reply STOP to opt out.`;
    const sms = await sendSmsInGhl(res.contactId, msg);
    console.log("Chat lead SMS:", sms.reason);
  }
  // Never show the visitor an error for a CRM hiccup; it's logged above.
  return NextResponse.json({ ok: true });
}

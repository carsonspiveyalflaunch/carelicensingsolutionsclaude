import { NextRequest, NextResponse } from "next/server";
import { addContactNoteInGhl, saveLeadInGhl } from "@/lib/ghl";
import { LEGAL_EMAIL } from "@/lib/legal";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECTS: Record<string, string> = {
  general: "General Inquiry",
  billing: "Billing Question",
  support: "Technical Support",
  partnership: "Partnership",
  other: "Other",
};

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function sendContactEmail(input: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; reason: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "no-resend" };
  const from = process.env.EMAIL_FROM || "Care Licensing Solutions <orders@carelicensingsolution.com>";
  const text = `${input.firstName} ${input.lastName} <${input.email}>\nSubject: ${input.subject}\n\n${input.message}`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [LEGAL_EMAIL],
        reply_to: input.email,
        subject: `Contact form: ${input.subject}`,
        text,
      }),
    });
    if (!res.ok) {
      console.error("Contact form email failed:", res.status);
      return { ok: false, reason: `resend-${res.status}` };
    }
    return { ok: true, reason: "emailed" };
  } catch (err) {
    console.error("Contact form email failed:", err instanceof Error ? err.message : "error");
    return { ok: false, reason: "resend-network" };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.company) return NextResponse.json({ ok: true });

  const firstName = clip(body.firstName, 60);
  const lastName = clip(body.lastName, 60);
  const emailRaw = clip(body.email, 200);
  const email = EMAIL.test(emailRaw) ? emailRaw : "";
  const subjectKey = typeof body.subject === "string" ? body.subject : "";
  const subject = SUBJECTS[subjectKey] || "";
  const message = clip(body.message, 5000);

  if (!firstName || !lastName || !email || !subject || message.length < 10) {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }

  const note = `Contact form — ${subject}\nFrom: ${firstName} ${lastName} <${email}>\n\n${message}`;
  const lead = await saveLeadInGhl({
    email,
    firstName,
    lastName,
    tags: ["cls-site-lead", "cls-lead-contact", `cls-contact-${subjectKey}`],
  });
  const noted = lead.contactId
    ? await addContactNoteInGhl(lead.contactId, note)
    : { ok: false, reason: lead.reason };
  const mailed = await sendContactEmail({ firstName, lastName, email, subject, message });
  console.log("Contact form:", lead.reason, noted.reason, mailed.reason);

  if (!noted.ok && !mailed.ok) {
    return NextResponse.json(
      { error: `We couldn't send that message. Email ${LEGAL_EMAIL} and we'll help.` },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}

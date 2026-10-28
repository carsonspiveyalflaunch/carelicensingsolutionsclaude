/**
 * Purchase email for the Meta $47 Market Research Report.
 * Sent through Resend (same HTTP API as the shop access email and contact form).
 * Launch-kit accept/decline hooks stay logs until those messages are written.
 *
 * The receipt links to the thank-you page. That page loads the report through
 * /api/funnel/downloads, so the email does not carry a short-lived Storage URL.
 */
import { LEGAL_EMAIL } from "@/lib/legal";
import { formatUsd } from "@/lib/meta-funnel";
import { STATE_NAMES } from "@/lib/us-states";

export type FunnelEmailHook =
  | "meta_mrr_purchased"
  | "meta_mrr_launch_kit_declined"
  | "meta_mrr_launch_kit_accepted";

export type FunnelEmailPayload = {
  email?: string | null;
  name?: string | null;
  sessionId?: string | null;
  state?: string | null;
  stateName?: string | null;
  program?: string | null;
  creditExpiresAt?: string | null;
  amount?: number | null;
};

export type FunnelEmailReason =
  | "sent"
  | "no-email"
  | "invalid-email"
  | "no-session"
  | "no-resend"
  | "resend-failed"
  | "resend-network"
  | "esp-not-wired";

export type FunnelEmailResult = {
  queued: boolean;
  reason: FunnelEmailReason;
  id?: string;
};

export const ORDERS_FROM = "Care Licensing Solutions <orders@carelicensingsolution.com>";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_URL = "https://api.resend.com/emails";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function clip(value: string | null | undefined, max: number): string {
  return (value || "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://carelicensingsolution.com").replace(/\/$/, "");
}

/** Stable download page. Signed file URLs are created when the buyer opens it. */
export function marketResearchDownloadUrl(sessionId: string): string {
  const params = new URLSearchParams({ session_id: sessionId.trim() });
  return `${siteUrl()}/market-research/thank-you?${params.toString()}`;
}

export function marketResearchIdempotencyKey(sessionId: string): string {
  return `meta-mrr-purchased/${sessionId.trim()}`.slice(0, 256);
}

/** Use the orders address. Ignore EMAIL_FROM when it is not that mailbox. */
export function receiptFromAddress(): string {
  const configured = (process.env.EMAIL_FROM || "").trim();
  if (/orders@carelicensingsolution\.com/i.test(configured)) return configured;
  return ORDERS_FROM;
}

/** Reply-To is the support mailbox. EMAIL_REPLY_TO is only a fallback. */
export function receiptReplyTo(): string {
  return LEGAL_EMAIL || (process.env.EMAIL_REPLY_TO || "").trim();
}

export function marketResearchPlace(payload: FunnelEmailPayload): string {
  const named = clip(payload.stateName, 80);
  const code = clip(payload.state, 8).toUpperCase();
  const state = named || STATE_NAMES[code] || clip(payload.state, 80);
  const program = clip(payload.program, 120);
  return [state, program].filter(Boolean).join(" / ");
}

/** "State Market Research Report for Arizona / Assisted Living ($47)". */
export function marketResearchProductLine(payload: FunnelEmailPayload): string {
  const place = marketResearchPlace(payload);
  const base = place ? `State Market Research Report for ${place}` : "State Market Research Report";
  const amount = payload.amount;
  if (amount == null || !Number.isFinite(Number(amount))) return base;
  return `${base} (${formatUsd(Number(amount))})`;
}

export type MarketResearchReceipt = {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  downloadUrl: string;
  idempotencyKey: string;
};

export function buildMarketResearchReceipt(payload: FunnelEmailPayload): MarketResearchReceipt | null {
  const to = clip(payload.email, 200).toLowerCase();
  const sessionId = clip(payload.sessionId, 200);
  if (!to || !EMAIL.test(to) || !sessionId) return null;

  const fullName = clip(payload.name, 120);
  const first = fullName.split(/\s+/)[0] || "";
  const product = marketResearchProductLine(payload);
  const downloadUrl = marketResearchDownloadUrl(sessionId);
  const contactUrl = `${siteUrl()}/contact`;
  const support = LEGAL_EMAIL;
  const subject = first
    ? `${first}, your Market Research Report is confirmed`
    : "Your Market Research Report is confirmed";

  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td>
<p style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#047857;font-weight:bold;margin:0 0 12px">Care Licensing Solutions</p>
<h1 style="font-size:22px;margin:0 0 16px">${first ? `${esc(first)}, your` : "Your"} report is confirmed</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 8px">${fullName ? `${esc(fullName)}, thanks for your purchase.` : "Thanks for your purchase."}</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 8px">You bought:</p>
<p style="font-size:16px;line-height:1.5;font-weight:bold;margin:0 0 24px">${esc(product)}</p>
<p style="margin:0 0 16px"><a href="${esc(downloadUrl)}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:8px">Download my report</a></p>
<p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 24px">That button opens your purchase page, where the report file is ready to download: <a href="${esc(downloadUrl)}" style="color:#047857">${esc(downloadUrl)}</a></p>
<p style="font-size:14px;line-height:1.5;color:#475569;margin:0">Questions? Email <a href="mailto:${esc(support)}" style="color:#047857">${esc(support)}</a> or visit <a href="${esc(contactUrl)}" style="color:#047857">${esc(contactUrl)}</a>.</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    first ? `${first}, your Market Research Report is confirmed.` : "Your Market Research Report is confirmed.",
    fullName ? `${fullName}, thanks for your purchase.` : "Thanks for your purchase.",
    "",
    `You bought: ${product}`,
    "",
    `Download your report: ${downloadUrl}`,
    "",
    `Questions? Email ${support} or visit ${contactUrl}.`,
  ].join("\n");

  return {
    to,
    from: receiptFromAddress(),
    replyTo: receiptReplyTo(),
    subject,
    html,
    text,
    downloadUrl,
    idempotencyKey: marketResearchIdempotencyKey(sessionId),
  };
}

type SendDeps = { fetchImpl?: typeof fetch };

async function resendErrorDetail(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const parsed = JSON.parse(text) as { name?: string; message?: string };
    return [parsed.name, parsed.message].filter(Boolean).join(": ").slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
}

/** Send the $47 report receipt. Never throws. */
export async function sendMarketResearchReceipt(
  payload: FunnelEmailPayload,
  deps?: SendDeps,
): Promise<FunnelEmailResult> {
  const email = clip(payload.email, 200);
  if (!email) return { queued: false, reason: "no-email" };
  if (!EMAIL.test(email)) return { queued: false, reason: "invalid-email" };
  if (!clip(payload.sessionId, 200)) return { queued: false, reason: "no-session" };

  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) {
    console.warn("RESEND_API_KEY not set; market research receipt not sent");
    return { queued: false, reason: "no-resend" };
  }

  const receipt = buildMarketResearchReceipt(payload);
  if (!receipt) return { queued: false, reason: "invalid-email" };

  try {
    const fetchImpl = deps?.fetchImpl || fetch;
    const res = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": receipt.idempotencyKey,
      },
      body: JSON.stringify({
        from: receipt.from,
        to: [receipt.to],
        reply_to: receipt.replyTo,
        subject: receipt.subject,
        html: receipt.html,
        text: receipt.text,
      }),
    });
    if (!res.ok) {
      const detail = await resendErrorDetail(res);
      console.error("Market research receipt failed:", res.status, detail);
      return { queued: false, reason: "resend-failed" };
    }
    const body = (await res.json().catch(() => ({}))) as { id?: string };
    return { queued: true, reason: "sent", ...(body.id ? { id: body.id } : {}) };
  } catch (err) {
    console.error("Market research receipt failed:", err instanceof Error ? err.message : "error");
    return { queued: false, reason: "resend-network" };
  }
}

function logStub(hook: FunnelEmailHook, payload: FunnelEmailPayload) {
  console.log(
    JSON.stringify({
      event: "funnel-email-stub",
      hook,
      email: payload.email || null,
      sessionId: payload.sessionId || null,
      state: payload.state || null,
      program: payload.program || null,
      creditExpiresAt: payload.creditExpiresAt || null,
      amount: payload.amount ?? null,
    }),
  );
}

export async function queueFunnelEmail(
  hook: FunnelEmailHook,
  payload: FunnelEmailPayload,
  deps?: SendDeps,
): Promise<FunnelEmailResult> {
  if (hook !== "meta_mrr_purchased") {
    logStub(hook, payload);
    return { queued: false, reason: "esp-not-wired" };
  }
  try {
    return await sendMarketResearchReceipt(payload, deps);
  } catch (err) {
    console.error("Market research receipt failed:", err instanceof Error ? err.message : "error");
    return { queued: false, reason: "resend-network" };
  }
}

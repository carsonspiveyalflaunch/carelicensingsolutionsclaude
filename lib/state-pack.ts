/**
 * $997 state pack: one Stripe line, and one full-kit metadata item per program
 * (no purchased_item, so delivery unlocks every file in each bundle).
 *
 * CLSSTATE1 is allowlisted for server-applied Checkout only. Create the
 * matching Stripe promotion code in the Dashboard with max_redemptions: 1
 * (100% off, or amount_off 99600 so the charge is $1). This repo does not
 * mint the coupon. The $47 checkout does not accept this code.
 */
import type Stripe from "stripe";
import { BUNDLE_RESOURCES } from "./bundle-offer";
import { skoolInviteUrl } from "./community";
import { CHECKOUT_AGREEMENT_TEXT, LEGAL_EMAIL } from "./legal";
import {
  receiptFromAddress,
  receiptReplyTo,
  siteUrl,
  type FunnelEmailResult,
} from "./funnel-email";
import {
  dollarsMetadata,
  funnelDiscountSessionFields,
  FunnelPromoError,
} from "./funnel-promo";
import { buildLaunchKitItem, formatUsd, type FunnelBundle } from "./meta-funnel";
import { packItemsMetadata, readItemsMetadata } from "./stripe-items";
import {
  CONTENT_STATE_PACK,
  STATE_PACK_FUNNEL,
  STATE_PACK_PRICE_DOLLARS,
  STATE_PACK_THANK_YOU_PATH,
  StatePackError,
  statePackStateName,
} from "./state-pack-shared";

export const STATE_PACK_PROMO = "CLSSTATE1";
export const STATE_PACK_PROMOS = new Set([STATE_PACK_PROMO]);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_URL = "https://api.resend.com/emails";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function clip(value: string | null | undefined, max: number): string {
  return (value || "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

/** Allowlisted code from the order body, or null when the buyer didn't send one. */
export function readStatePackPromo(input: {
  promotionCode?: unknown;
  promoCode?: unknown;
  promo?: unknown;
}): string | null {
  const raw = input.promotionCode ?? input.promoCode ?? input.promo;
  if (raw == null) return null;
  const code = String(raw).trim().toUpperCase();
  if (!code) return null;
  if (!STATE_PACK_PROMOS.has(code)) {
    throw new FunnelPromoError("That promotion code can't be used on this checkout.");
  }
  return code;
}

function allocateDollars(count: number, totalDollars: number): number[] {
  const totalCents = Math.round(totalDollars * 100);
  const base = Math.floor(totalCents / count);
  let remainder = totalCents - base * count;
  return Array.from({ length: count }, () => {
    const cents = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return cents / 100;
  });
}

/**
 * One full kit per program. Prices are a split of the $997 pack so they sum
 * to the pack price. None of them sets purchased_item.
 */
export function buildStatePackItems(bundles: FunnelBundle[]) {
  if (!bundles.length) throw new StatePackError("That state isn't available yet.");
  const prices = allocateDollars(bundles.length, STATE_PACK_PRICE_DOLLARS);
  return bundles.map((bundle, index) => buildLaunchKitItem(bundle, prices[index]));
}

export function statePackProductName(stateName: string): string {
  const place = clip(stateName, 80) || "Your state";
  return `${place} — all program packs`;
}

export function statePackLineDescription(): string {
  return "Every program pack available for this state, plus Skool community access. Instant download.";
}

type AppliedPromo = { id: string; code: string; percent: number; total: number } | null;

export function buildStatePackSessionParams(input: {
  code: string;
  stateName: string;
  items: Record<string, unknown>[];
  applied: AppliedPromo;
  charged: number;
  subtotal: number;
  userId?: string | null;
  attribution?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  saveCard: boolean;
  paymentIntent: boolean;
  collectIfRequired: boolean;
}): Stripe.Checkout.SessionCreateParams {
  const metadata: Record<string, string> = {
    funnel: STATE_PACK_FUNNEL,
    pack: "all_programs",
    state: input.code,
    program: "",
    state_name: input.stateName,
    content_ids: CONTENT_STATE_PACK,
    discount_code: input.applied?.code || "",
    discount_percent: input.applied ? String(input.applied.percent) : "0",
    tax_amount: "0",
    subtotal: String(input.subtotal),
    total: dollarsMetadata(input.charged),
    customer_info: "{}",
    customer_first_name: "",
    customer_last_name: "",
    ...packItemsMetadata(input.items),
    ...(input.attribution || {}),
  };
  if (input.userId) metadata.user_id = input.userId;

  const fields: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer_creation: "always",
    // Leave payment_method_types unset so Checkout keeps every method enabled
    // on the Stripe account (card, Afterpay, Zip, and any other automatic method).
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: STATE_PACK_PRICE_DOLLARS * 100,
          product_data: {
            name: statePackProductName(input.stateName),
            description: statePackLineDescription(),
          },
        },
      },
    ],
    ...funnelDiscountSessionFields(input.applied),
    custom_text: { submit: { message: CHECKOUT_AGREEMENT_TEXT } },
    metadata,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    ...(process.env.STRIPE_CHECKOUT_RECOVERY === "1"
      ? {
          consent_collection: { promotions: "auto" as const },
          after_expiration: { recovery: { enabled: true, allow_promotion_codes: false } },
        }
      : {}),
  };
  if (!input.collectIfRequired) delete fields.payment_method_collection;
  if (input.paymentIntent) {
    fields.payment_intent_data = {
      ...(input.saveCard ? { setup_future_usage: "off_session" as const } : {}),
      metadata: { funnel: STATE_PACK_FUNNEL, role: "state_pack" },
    };
  }
  return fields;
}

export function statePackProgramsFromItems(
  items: { product_slug?: unknown; type?: unknown; program?: unknown }[],
): { program: string; slug: string }[] {
  const out: { program: string; slug: string }[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const slug = String(item.product_slug || "").trim();
    const program = String(item.type || item.program || "").trim();
    if (!slug || !program || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ program, slug });
  }
  out.sort((a, b) => a.program.localeCompare(b.program));
  return out;
}

export function statePackDownloadUrl(sessionId: string): string {
  const params = new URLSearchParams({ session_id: sessionId.trim() });
  return `${siteUrl()}${STATE_PACK_THANK_YOU_PATH}?${params.toString()}`;
}

export type StatePackReceiptInput = {
  email?: string | null;
  name?: string | null;
  sessionId?: string | null;
  state?: string | null;
  stateName?: string | null;
  programs?: string[] | null;
  amount?: number | null;
  skoolUrl?: string | null;
};

export type StatePackReceipt = {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  downloadUrl: string;
  skoolUrl: string;
  idempotencyKey: string;
};

function programBlocks(programs: string[]): { program: string; assets: readonly string[] }[] {
  const names = [...new Set(programs.map((name) => clip(name, 120)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const rows = names.length ? names : ["Every program pack"];
  return rows.map((program) => ({ program, assets: BUNDLE_RESOURCES }));
}

export function buildStatePackReceipt(input: StatePackReceiptInput): StatePackReceipt | null {
  const to = clip(input.email, 200).toLowerCase();
  const sessionId = clip(input.sessionId, 200);
  if (!to || !EMAIL.test(to) || !sessionId) return null;

  const fullName = clip(input.name, 120);
  const first = fullName.split(/\s+/)[0] || "";
  const place = statePackStateName(clip(input.state, 8).toUpperCase(), input.stateName);
  const amount = input.amount;
  const price =
    amount == null || !Number.isFinite(Number(amount)) ? "" : ` (${formatUsd(Number(amount))})`;
  const blocks = programBlocks(input.programs || []);
  const downloadUrl = statePackDownloadUrl(sessionId);
  const skoolUrl = clip(input.skoolUrl, 400) || skoolInviteUrl();
  const contactUrl = `${siteUrl()}/contact`;
  const support = LEGAL_EMAIL;
  const subject = first ? `${first}, your ${place} program packs are ready` : `Your ${place} program packs are ready`;

  const textBlocks = blocks
    .map((block) => `${block.program}\n${block.assets.map((asset) => `- ${asset}`).join("\n")}`)
    .join("\n\n");
  const htmlBlocks = blocks
    .map(
      (block) =>
        `<p style="font-size:16px;line-height:1.5;font-weight:bold;margin:16px 0 4px">${esc(block.program)}</p><ul style="font-size:15px;line-height:1.5;margin:0 0 8px;padding-left:20px">${block.assets
          .map((asset) => `<li>${esc(asset)}</li>`)
          .join("")}</ul>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td>
<p style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#047857;font-weight:bold;margin:0 0 12px">Care Licensing Solutions</p>
<h1 style="font-size:22px;margin:0 0 16px">${first ? `${esc(first)}, your` : "Your"} ${esc(place)} packs are ready</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 8px">${fullName ? `${esc(fullName)}, thanks for your purchase.` : "Thanks for your purchase."}</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 8px">You unlocked every program pack for ${esc(place)}${esc(price)}, plus Skool community access.</p>
${htmlBlocks}
<p style="margin:24px 0 16px"><a href="${esc(downloadUrl)}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:8px">Open my packs</a></p>
<div style="background:#ecfdf5;border-radius:10px;padding:20px;margin:0 0 24px">
<p style="font-weight:bold;font-size:16px;margin:0 0 6px">Skool community access</p>
<p style="font-size:15px;line-height:1.5;margin:0 0 12px">Your purchase includes the community. Use this invite if a separate Skool email has not arrived yet.</p>
<a href="${esc(skoolUrl)}" style="color:#047857;font-weight:bold">Join Skool</a>
</div>
<p style="font-size:14px;line-height:1.5;color:#475569;margin:0">Questions? Email <a href="mailto:${esc(support)}" style="color:#047857">${esc(support)}</a> or visit <a href="${esc(contactUrl)}" style="color:#047857">${esc(contactUrl)}</a>.</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    first ? `${first}, your ${place} program packs are ready.` : `Your ${place} program packs are ready.`,
    fullName ? `${fullName}, thanks for your purchase.` : "Thanks for your purchase.",
    "",
    `You unlocked every program pack for ${place}${price}, plus Skool community access.`,
    "",
    textBlocks,
    "",
    `Open your packs: ${downloadUrl}`,
    "",
    "Skool community access",
    "Your purchase includes the community. Use this invite if a separate Skool email has not arrived yet.",
    skoolUrl,
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
    skoolUrl,
    idempotencyKey: `state-pack/${sessionId}`.slice(0, 256),
  };
}

type EmailSession = {
  id: string;
  amount_total?: number | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  customer_email?: string | null;
  metadata?: Record<string, string> | null;
};

export async function queueStatePackPurchaseEmail(
  session: EmailSession,
  deps?: { fetchImpl?: typeof fetch },
): Promise<FunnelEmailResult> {
  try {
    const items = readItemsMetadata(session.metadata);
    const programs = statePackProgramsFromItems(items).map((row) => row.program);
    const email = session.customer_details?.email || session.customer_email || session.metadata?.customer_email;
    const receipt = buildStatePackReceipt({
      email,
      name: session.customer_details?.name,
      sessionId: session.id,
      state: session.metadata?.state,
      stateName: session.metadata?.state_name,
      programs,
      amount: session.amount_total != null ? session.amount_total / 100 : null,
      skoolUrl: skoolInviteUrl(),
    });
    if (!receipt) {
      if (!clip(email, 200)) return { queued: false, reason: "no-email" };
      if (!EMAIL.test(clip(email, 200))) return { queued: false, reason: "invalid-email" };
      return { queued: false, reason: "no-session" };
    }
    const key = (process.env.RESEND_API_KEY || "").trim();
    if (!key) {
      console.warn("RESEND_API_KEY not set; state pack receipt not sent");
      return { queued: false, reason: "no-resend" };
    }
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
      console.error("State pack receipt failed:", res.status);
      return { queued: false, reason: "resend-failed" };
    }
    const body = (await res.json().catch(() => ({}))) as { id?: string };
    console.log("State pack receipt:", "sent", session.id);
    return { queued: true, reason: "sent", ...(body.id ? { id: body.id } : {}) };
  } catch (err) {
    console.error("State pack receipt failed:", err instanceof Error ? err.message : "error");
    return { queued: false, reason: "resend-network" };
  }
}

export function statePackOrderSummary(session: EmailSession & { metadata?: Record<string, string> | null }) {
  const items = readItemsMetadata(session.metadata);
  const programs = statePackProgramsFromItems(items);
  return {
    paid: true,
    amount: typeof session.amount_total === "number" ? Math.round(session.amount_total) / 100 : 0,
    currency: "USD",
    contentIds: [CONTENT_STATE_PACK],
    stateCode: session.metadata?.state || "",
    stateName: statePackStateName(session.metadata?.state || "", session.metadata?.state_name),
    email: session.customer_details?.email || session.customer_email || null,
    skoolUrl: skoolInviteUrl(),
    programs: programs.map((row) => ({
      program: row.program,
      slug: row.slug,
      assets: [...BUNDLE_RESOURCES],
    })),
  };
}

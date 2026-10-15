/**
 * Ties paid purchases to buyer accounts by email, so a buyer gets their
 * downloads whether or not they made an account on the thank-you page.
 */
import { resolveProductForItem } from "@/lib/resolve-product";
import { SKOOL_COMMUNITY_URL } from "@/lib/community";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://carelicensingsolution.com").replace(/\/$/, "");

const norm = (e: unknown) => String(e || "").trim().toLowerCase();

function purchaseEmail(p: any): string {
  return norm(p?.metadata?.customer_email || p?.metadata?.customer_info?.email);
}

function purchaseItems(p: any): any[] {
  const items = p?.metadata?.items;
  if (Array.isArray(items)) return items;
  try {
    return JSON.parse(items || "[]");
  } catch {
    return [];
  }
}

/** Grant the products in one purchase to a user (idempotent). */
export async function grantPurchase(supabase: any, userId: string, purchase: any) {
  const byProduct: Record<string, string[]> = {};
  for (const item of purchaseItems(purchase)) {
    const product = await resolveProductForItem(supabase, item);
    if (!product?.id) continue;
    byProduct[product.id] ||= [];
    if (item.purchased_item) byProduct[product.id].push(item.purchased_item);
  }
  for (const [productId, picked] of Object.entries(byProduct)) {
    const { error } = await supabase.from("user_products").upsert(
      {
        user_id: userId,
        product_id: productId,
        purchase_id: purchase.id,
        granted_at: new Date().toISOString(),
        is_active: true,
        purchased_items: picked.length ? picked : null,
      },
      { onConflict: "user_id,product_id" },
    );
    if (error) console.error(`grantPurchase failed for ${productId}:`, error);
  }
  return Object.keys(byProduct).length;
}

/**
 * Attach every completed guest purchase made with this email to the user and
 * grant access. Also re-grants purchases already owned by the user, in case a
 * grant was missed. Returns how many purchases were processed.
 */
export async function claimPurchasesForUser(supabase: any, userId: string, email: string) {
  const target = norm(email);
  if (!userId || !target) return 0;

  const { data: candidates, error } = await supabase
    .from("purchases")
    .select("id, user_id, status, metadata")
    .eq("status", "completed")
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .ilike("metadata->>customer_email", target);
  if (error) {
    console.error("claimPurchasesForUser lookup failed:", error);
    return 0;
  }

  let count = 0;
  for (const p of candidates || []) {
    // ilike treats _ and % as wildcards, so confirm the exact address.
    if (purchaseEmail(p) !== target) continue;
    if (!p.user_id) {
      const { error: claimErr } = await supabase
        .from("purchases")
        .update({ user_id: userId })
        .eq("id", p.id)
        .is("user_id", null);
      if (claimErr) {
        console.error(`Could not claim purchase ${p.id}:`, claimErr);
        continue;
      }
    }
    await grantPurchase(supabase, userId, p);
    count++;
  }
  return count;
}

/** Find or create a confirmed account for a buyer. Returns the user id. */
export async function ensureBuyerAccount(supabase: any, email: string, name?: string): Promise<string | null> {
  const target = norm(email);
  if (!target) return null;
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: target,
    email_confirm: true,
    user_metadata: name ? { full_name: name } : undefined,
  });
  if (created?.user?.id) return created.user.id;
  if (error && !/already|registered|exists/i.test(error.message || "")) {
    console.error("ensureBuyerAccount createUser failed:", error);
  }
  // Existing account: a magic link lookup returns the user without sending mail.
  const { data: link } = await supabase.auth.admin.generateLink({ type: "magiclink", email: target });
  return link?.user?.id || null;
}

/** One-click login link that lands on the dashboard. */
export async function loginLink(supabase: any, email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: norm(email),
    options: { redirectTo: `${SITE_URL}/dashboard` },
  });
  if (error) {
    console.error("loginLink failed:", error);
    return null;
  }
  return data?.properties?.action_link || null;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Sends the "your bundle is ready" email through Resend. Returns true when sent. */
export async function sendAccessEmail(opts: {
  email: string;
  name?: string;
  productNames: string[];
  link: string;
  includeSkool: boolean;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY not set; access email not sent");
    return false;
  }
  const from = process.env.EMAIL_FROM || "Care Licensing Solutions <orders@carelicensingsolution.com>";
  const first = (opts.name || "").trim().split(/\s+/)[0];
  const list = opts.productNames.length ? opts.productNames : ["Your licensing bundle"];
  const subject = list.length === 1 ? `Your download is ready: ${list[0]}` : "Your downloads are ready";

  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td>
<p style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#047857;font-weight:bold;margin:0 0 12px">Care Licensing Solutions</p>
<h1 style="font-size:22px;margin:0 0 16px">${first ? `${esc(first)}, your` : "Your"} files are ready</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 8px">Thanks for your purchase. You now have access to:</p>
<ul style="font-size:16px;line-height:1.6;margin:0 0 24px;padding-left:20px">${list.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
<p style="margin:0 0 24px"><a href="${opts.link}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:8px">Open my downloads</a></p>
<p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 24px">This button logs you in automatically, no password needed. If it has expired, get a fresh one anytime at <a href="${SITE_URL}/access" style="color:#047857">${SITE_URL.replace(/^https?:\/\//, "")}/access</a> using this email address.</p>
${
  opts.includeSkool
    ? `<div style="background:#ecfdf5;border-radius:10px;padding:20px;margin:0 0 24px">
<p style="font-weight:bold;font-size:16px;margin:0 0 6px">Your community access is included</p>
<p style="font-size:15px;line-height:1.5;margin:0 0 12px">Join other owners licensing and launching their agencies. Ask questions and get answers.</p>
<a href="${SKOOL_COMMUNITY_URL}" style="color:#047857;font-weight:bold">Join the community &rarr;</a></div>`
    : ""
}
<p style="font-size:13px;color:#94a3b8;margin:0">Questions? Reply through <a href="${SITE_URL}/contact" style="color:#94a3b8">${SITE_URL.replace(/^https?:\/\//, "")}/contact</a>.</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = `${first ? `${first}, your` : "Your"} files are ready.\n\n${list.map((n) => `- ${n}`).join("\n")}\n\nOpen your downloads (logs you in automatically): ${opts.link}\nIf the link expired, get a new one at ${SITE_URL}/access\n${opts.includeSkool ? `\nJoin the community: ${SKOOL_COMMUNITY_URL}\n` : ""}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [norm(opts.email)],
      subject,
      html,
      text,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
    }),
  });
  if (!res.ok) {
    console.error("Resend send failed:", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

/**
 * Full delivery for one email address: make sure the account exists, attach
 * all of that email's purchases, and email a login link. Used by the Stripe
 * webhook and by the /access page.
 */
export async function deliverAccess(supabase: any, email: string, name?: string) {
  const userId = await ensureBuyerAccount(supabase, email, name);
  if (!userId) return { ok: false, reason: "no-account" };
  await claimPurchasesForUser(supabase, userId, email);

  const { data: owned } = await supabase
    .from("user_products")
    .select("products(name, product_slug)")
    .eq("user_id", userId)
    .eq("is_active", true);
  const products = (owned || []).map((r: any) => r.products).filter(Boolean);
  if (!products.length) return { ok: false, reason: "no-products" };

  const link = await loginLink(supabase, email);
  if (!link) return { ok: false, reason: "no-link" };
  const sent = await sendAccessEmail({
    email,
    name,
    productNames: products.map((p: any) => p.name),
    link,
    includeSkool: products.some((p: any) => String(p.product_slug || "").endsWith("-complete-bundle")),
  });
  return { ok: sent, reason: sent ? "sent" : "send-failed" };
}

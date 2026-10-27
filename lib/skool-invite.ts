/**
 * Skool academy invite for a complete-bundle purchase.
 *
 * Checkout (checkout.session.completed) and one-click Launch Kit fulfillment
 * both post the same bundle_purchase_send_skool_invite hook. A row in webhooks,
 * keyed by PaymentIntent id, is the lock: purchase upserts replace metadata,
 * so a flag stored only on the purchase would be wiped and the invite would
 * send twice when the API and payment_intent.succeeded both fulfill.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const BUNDLE_SKOOL_INVITE_EVENT = "bundle_purchase_send_skool_invite";

const MARKER_PREFIX = "skool-invite:";

type InviteItem = {
  purchased_item?: unknown;
  product_slug?: unknown;
  name?: unknown;
};

/**
 * A whole bundle. Single files keep the bundle slug and set purchased_item,
 * and those do not get an academy invite.
 */
export function isCompleteBundleLine(item: InviteItem | null | undefined): boolean {
  if (!item || item.purchased_item) return false;
  const slug = String(item.product_slug || "");
  return slug.endsWith("-complete-bundle") || slug.startsWith("bundle-");
}

/** PaymentIntent id when the charge has one, otherwise the purchase row. */
export function skoolInviteIdempotencyKey(paymentIntentId?: string | null, purchaseId?: string | null): string {
  const pi = (paymentIntentId || "").trim();
  if (pi) return pi;
  const purchase = (purchaseId || "").trim();
  return purchase ? `purchase:${purchase}` : "";
}

export function bundleSkoolInvitePayload(input: {
  email: string;
  name?: string | null;
  items: InviteItem[];
  purchaseId: string;
  purchaseDate?: string;
}): Record<string, unknown> {
  const email = input.email.trim();
  const bundles = input.items
    .map((item) => item.name)
    .filter(Boolean)
    .join(", ");
  return {
    event: BUNDLE_SKOOL_INVITE_EVENT,
    customer_email: email,
    customer_name: (input.name || "").trim() || email,
    bundles,
    purchase_id: input.purchaseId,
    purchase_date: input.purchaseDate || new Date().toISOString(),
  };
}

/** POST the existing Zapier/Skool hook. Missing URL is a skip, not a throw. */
export async function sendSkoolInvite(payload: Record<string, unknown>): Promise<"sent" | "skipped" | "failed"> {
  const url = process.env.SKOOL_INVITE_WEBHOOK_URL;
  if (!url) {
    console.log("SKOOL_INVITE_WEBHOOK_URL not set; skipping Skool invite");
    return "skipped";
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`Skool invite hook responded ${res.status}`);
    return "sent";
  } catch (error) {
    console.error("Skool invite hook failed:", error);
    return "failed";
  }
}

function isUniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === "23505" || /duplicate key/i.test(error.message || "");
}

function markerId(idempotencyKey: string): string {
  return `${MARKER_PREFIX}${idempotencyKey}`;
}

async function releaseMarker(supabase: SupabaseClient, stripeEventId: string) {
  const { error } = await supabase.from("webhooks").delete().eq("stripe_event_id", stripeEventId);
  if (error) console.error("Skool invite marker release failed:", error);
}

/**
 * Send at most one academy invite for this charge.
 * A failed or unconfigured hook releases the lock so a later fulfillment can send.
 * A duplicate lock means this charge already claimed the invite.
 */
export async function sendBundleSkoolInviteOnce(
  supabase: SupabaseClient,
  input: { idempotencyKey: string; payload: Record<string, unknown> },
): Promise<"sent" | "duplicate" | "skipped" | "failed"> {
  const key = input.idempotencyKey.trim();
  if (!key) {
    console.error("Skool invite has no idempotency key; sending this attempt without a lock");
    return sendSkoolInvite(input.payload);
  }

  const stripeEventId = markerId(key);
  let claimed = false;
  try {
    const { error: insertError } = await supabase.from("webhooks").insert({
      stripe_event_id: stripeEventId,
      event_type: BUNDLE_SKOOL_INVITE_EVENT,
      event_data: input.payload,
      processed: false,
    });
    if (insertError) {
      if (isUniqueViolation(insertError)) {
        console.log(`Skool invite already recorded for ${key}`);
        return "duplicate";
      }
      console.error("Skool invite marker failed; sending without a lock:", insertError);
      return sendSkoolInvite(input.payload);
    }
    claimed = true;
    const result = await sendSkoolInvite(input.payload);
    if (result === "sent") {
      const { error: updateError } = await supabase
        .from("webhooks")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("stripe_event_id", stripeEventId);
      if (updateError) console.error("Skool invite marker update failed:", updateError);
      return "sent";
    }
    await releaseMarker(supabase, stripeEventId);
    return result;
  } catch (error) {
    console.error("Skool invite failed:", error);
    if (claimed) await releaseMarker(supabase, stripeEventId);
    return "failed";
  }
}

/** checkout.session.completed path. Same event the bundle purchase already used. */
export async function sendCheckoutBundleSkoolInvite(
  supabase: SupabaseClient,
  input: {
    items: InviteItem[];
    isCourseEnrollment: boolean;
    email?: string | null;
    customerName?: string | null;
    paymentIntentId?: string | null;
    purchaseId: string;
  },
): Promise<void> {
  const email = (input.email || "").trim();
  if (input.isCourseEnrollment || !email) return;
  if (!input.items.some((item) => isCompleteBundleLine(item))) return;
  await sendBundleSkoolInviteOnce(supabase, {
    idempotencyKey: skoolInviteIdempotencyKey(input.paymentIntentId, input.purchaseId),
    payload: bundleSkoolInvitePayload({
      email,
      name: input.customerName,
      items: input.items,
      purchaseId: input.purchaseId,
    }),
  });
}

/** One-click Launch Kit PaymentIntent. No-op unless the line is a complete bundle. */
export async function sendLaunchKitSkoolInvite(
  supabase: SupabaseClient,
  input: {
    items: InviteItem[];
    email?: string | null;
    customerName?: string | null;
    paymentIntentId?: string | null;
    purchaseId: string;
  },
): Promise<void> {
  const email = (input.email || "").trim();
  if (!email) return;
  if (!input.items.some((item) => isCompleteBundleLine(item))) return;
  await sendBundleSkoolInviteOnce(supabase, {
    idempotencyKey: skoolInviteIdempotencyKey(input.paymentIntentId, input.purchaseId),
    payload: bundleSkoolInvitePayload({
      email,
      name: input.customerName,
      items: input.items,
      purchaseId: input.purchaseId,
    }),
  });
}

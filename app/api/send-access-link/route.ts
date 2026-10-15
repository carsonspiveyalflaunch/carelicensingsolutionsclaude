import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { deliverAccess } from "@/lib/purchase-access";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recent = new Map<string, number>();

// Emails a fresh one-click login link to anyone who has bought with this
// address. Always answers the same way so it can't be used to look up buyers.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const reply = NextResponse.json({
    message: "If that email has a purchase, a login link is on its way. Check your inbox and spam folder.",
  });
  if (!EMAIL.test(email)) return reply;

  // Light throttle: one link per address per minute on this instance.
  const last = recent.get(email) || 0;
  if (Date.now() - last < 60_000) return reply;
  recent.set(email, Date.now());

  const supabase = createServerSupabaseClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, metadata")
    .eq("status", "completed")
    .ilike("metadata->>customer_email", email)
    .limit(5);
  const hasPurchase = (purchases || []).some(
    (p: any) => String(p?.metadata?.customer_email || "").trim().toLowerCase() === email,
  );

  let ownsProducts = false;
  if (!hasPurchase) {
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).limit(1).maybeSingle();
    if (profile?.id) {
      const { count } = await supabase
        .from("user_products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_active", true);
      ownsProducts = (count || 0) > 0;
    }
  }
  if (!hasPurchase && !ownsProducts) return reply;

  try {
    const result = await deliverAccess(supabase, email);
    console.log(`send-access-link: ${result.reason}`);
  } catch (e) {
    console.error("send-access-link failed:", e);
  }
  return reply;
}

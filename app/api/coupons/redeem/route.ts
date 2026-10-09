import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.COUPON_REDEEM_API_SECRET;
  const suppliedSecret = request.headers.get("x-internal-api-key");

  return Boolean(configuredSecret && suppliedSecret && suppliedSecret === configuredSecret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const productId = typeof body.productId === "string" ? body.productId : "";

    if (!code || !email || !productId) {
      return NextResponse.json({ error: "code, email, and productId are required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: redeemedCoupon, error } = await supabase
      .from("coupons")
      .update({
        status: "USED",
        used_count: 1,
        used_at: new Date().toISOString(),
      })
      .eq("code", code)
      .eq("email", email)
      .eq("product_id", productId)
      .eq("status", "ACTIVE")
      .eq("used_count", 0)
      .select("id, code, email, product_id, status, used_count, used_at")
      .maybeSingle();

    if (error) {
      console.error("Coupon redemption failed:", error);
      return NextResponse.json({ error: "Failed to redeem coupon" }, { status: 500 });
    }

    if (!redeemedCoupon) {
      return NextResponse.json({ redeemed: false, error: "Coupon is invalid or already used" }, { status: 409 });
    }

    console.log("Redeemed QuickBooks course coupon", {
      couponId: redeemedCoupon.id,
      productId,
      email,
      purchaseId: body.purchaseId || null,
    });

    return NextResponse.json({ redeemed: true, coupon: redeemedCoupon });
  } catch (error) {
    console.error("Coupon redemption request failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
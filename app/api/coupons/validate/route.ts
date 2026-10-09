import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

const COURSE_SLUG = "course-operational-success-academy";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!code || !email) {
      return NextResponse.json({ valid: false, error: "Coupon code and email are required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("id, code, email, discount_percent, status, used_count, max_uses, expires_at, product_id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("Coupon validation lookup failed:", error);
      return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
    }

    const isExpired = coupon?.expires_at && new Date(coupon.expires_at).getTime() <= Date.now();
    const emailMatches = coupon?.email?.toLowerCase() === email;
    const usesAvailable = coupon && coupon.used_count < coupon.max_uses;

    if (!coupon || !emailMatches || coupon.status !== "ACTIVE" || !usesAvailable || isExpired) {
      return NextResponse.json({ valid: false, error: "Invalid or unavailable coupon" }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, product_slug, price, name")
      .eq("id", coupon.product_id)
      .eq("product_slug", COURSE_SLUG)
      .eq("type", "course")
      .eq("is_active", true)
      .maybeSingle();

    if (productError || !product) {
      console.error("Coupon product validation failed:", productError);
      return NextResponse.json({ valid: false, error: "Coupon product is unavailable" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountPercent: 100,
      product: { id: product.id, slug: product.product_slug, name: product.name, price: product.price },
    });
  } catch (error) {
    console.error("Coupon validation failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
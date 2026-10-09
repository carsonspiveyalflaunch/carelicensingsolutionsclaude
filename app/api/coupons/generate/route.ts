import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/utils/supabase-server";

const COURSE_SLUG = "course-operational-success-academy";

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.QUICKBOOKS_COUPON_API_SECRET;
  const suppliedSecret = request.headers.get("x-internal-api-key");

  return Boolean(
    configuredSecret && suppliedSecret && suppliedSecret === configuredSecret,
  );
}

function generateCouponCode() {
  return `CLS-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const quickbooksPaymentId =
      typeof body.quickbooksPaymentId === "string"
        ? body.quickbooksPaymentId.trim()
        : "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    if (!quickbooksPaymentId) {
      return NextResponse.json(
        { error: "quickbooksPaymentId is required" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: existingCoupon, error: lookupError } = await supabase
      .from("coupons")
      .select("id, code, email, discount_percent, status, quickbooks_payment_id")
      .eq("quickbooks_payment_id", quickbooksPaymentId)
      .maybeSingle();

    if (lookupError) {
      console.error("QuickBooks coupon lookup failed:", lookupError);
      return NextResponse.json({ error: "Failed to check payment" }, { status: 500 });
    }

    if (existingCoupon) {
      if (existingCoupon.email !== email) {
        console.error("QuickBooks payment was submitted with a different email", {
          quickbooksPaymentId,
        });
        return NextResponse.json(
          { error: "Payment is already associated with another customer" },
          { status: 409 },
        );
      }

      return NextResponse.json({ coupon: existingCoupon, alreadyProcessed: true });
    }

    const { data: existingCourse, error: courseError } = await supabase
      .from("products")
      .select("id, product_slug, price, type, is_active")
      .eq("product_slug", COURSE_SLUG)
      .maybeSingle();

    if (courseError) {
      console.error("Course product lookup failed:", courseError);
      return NextResponse.json(
        { error: "Eligible course product is not configured" },
        { status: 500 },
      );
    }

    let course = existingCourse;
    if (!course) {
      const { data: createdCourse, error: createCourseError } = await supabase
        .from("products")
        .insert({
          name: "Care Licensing Solutions Operational Success Academy",
          product_slug: COURSE_SLUG,
          description: "Complete 11-module video training system for care business licensing and operations",
          price: 0,
          type: "course",
          is_active: true,
          metadata: {
            course_type: "operational-success-academy",
            enrollment_type: "course",
          },
        })
        .select("id, product_slug, price, type, is_active")
        .single();

      if (createCourseError) {
        console.error("Course product creation failed:", createCourseError);
        return NextResponse.json(
          { error: "Eligible course product is not configured" },
          { status: 500 },
        );
      }

      course = createdCourse;
    }

    if (course.type !== "course" || !course.is_active) {
      return NextResponse.json(
        { error: "Eligible course product is not configured" },
        { status: 500 },
      );
    }

    const coupon = {
      id: randomUUID(),
      code: generateCouponCode(),
      product_id: course.id,
      email,
      discount_percent: 100,
      max_uses: 1,
      used_count: 0,
      quickbooks_payment_id: quickbooksPaymentId,
      status: "ACTIVE",
    };

    const { data: createdCoupon, error: insertError } = await supabase
      .from("coupons")
      .insert(coupon)
      .select("id, code, email, discount_percent, status, quickbooks_payment_id, product_id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: duplicateCoupon } = await supabase
          .from("coupons")
          .select("id, code, email, discount_percent, status, quickbooks_payment_id")
          .eq("quickbooks_payment_id", quickbooksPaymentId)
          .maybeSingle();

        if (duplicateCoupon?.email === email) {
          return NextResponse.json({ coupon: duplicateCoupon, alreadyProcessed: true });
        }
      }

      console.error("QuickBooks coupon creation failed:", insertError);
      return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
    }

    console.log("Created QuickBooks course coupon", {
      couponId: createdCoupon.id,
      quickbooksPaymentId,
      email,
      productId: course.id,
    });

    return NextResponse.json({ coupon: createdCoupon, alreadyProcessed: false }, { status: 201 });
  } catch (error) {
    console.error("QuickBooks coupon generation failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
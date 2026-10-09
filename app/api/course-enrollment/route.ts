import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

const COURSE_PRICE = 69700; // $697 in cents
const COURSE_NAME = "Care Licensing Solutions Operational Success Academy";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const { successUrl, cancelUrl } = await request.json();

    // Create checkout session for course enrollment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: COURSE_NAME,
              description: 'Complete 11-module video training system for care business licensing and operations',
              images: [], // Add product image URL if available
            },
            unit_amount: COURSE_PRICE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        course_type: 'operational-success-academy',
        enrollment_type: 'course',
        product_slug: 'course-operational-success-academy',
        total: COURSE_PRICE.toString(),
        subtotal: COURSE_PRICE.toString(),
        discount_percent: '0',
        tax_amount: '0',
        discount_code: '',
        items: JSON.stringify([
          {
            product_slug: 'course-operational-success-academy',
            name: COURSE_NAME,
            price: COURSE_PRICE / 100, // Convert back to dollars for storage
            quantity: 1,
            type: 'course',
          },
        ]),
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/course/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/course?cancelled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Course enrollment session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create enrollment session" },
      { status: 500 }
    );
  }
}

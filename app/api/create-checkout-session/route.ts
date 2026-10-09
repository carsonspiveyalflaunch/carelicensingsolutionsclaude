import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const supabase = createServerSupabaseClient();

    const authHeader = request.headers.get('authorization') || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Get user if authenticated, but allow guest checkout
    let userId: string | null = null;
    if (accessToken) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (!authError && user) {
        userId = user.id;
      }
    }

    const {
      items,
      successUrl,
      cancelUrl,
      discountCode,
      customerEmail,
      customerInfo
    } = await request.json();

    console.log('📋 Checkout session request received with items:', JSON.stringify(items, null, 2));

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * (item.quantity || 1), 0);
    const normalizedDiscountCode = typeof discountCode === 'string' ? discountCode.trim().toUpperCase() : '';
    const quickBooksCoupon = await getValidQuickBooksCoupon(
      supabase,
      normalizedDiscountCode,
      customerEmail,
      items,
    );
    const discountPercent = normalizedDiscountCode.startsWith('CLS-')
      ? quickBooksCoupon
        ? 100
        : 0
      : getDiscountPercent(normalizedDiscountCode);

    if (normalizedDiscountCode.startsWith('CLS-') && !quickBooksCoupon) {
      return NextResponse.json(
        { error: "Invalid or unavailable course coupon" },
        { status: 400 },
      );
    }

    const discountAmount = (subtotal * discountPercent) / 100;
    const taxRate = 0.08; // 8% tax
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const total = subtotal - discountAmount + taxAmount;

    // Debug: Show what will be stored in metadata
    const metadataItems = items.map((item: any) => ({
      product_slug: item.product_slug || item.id || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      product_id: item.product_id || null,
      bundle_id: item.bundle_id || null,
      purchased_item: item.purchased_item || null,
      purchased_item_price: item.purchased_item_price || null,
      type: item.type || null,
      state: item.state || null,
    }));
    console.log('💾 Items being stored in Stripe metadata:', JSON.stringify(metadataItems, null, 2));

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || `Product: ${item.name}`,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity || 1,
    }));

    // Add tax as a separate line item if needed
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax (8%)',
            description: 'Sales tax',
          },
          unit_amount: Math.round(taxAmount * 100),
        },
        quantity: 1,
      });
    }

    // Apply discount if any
    const discounts = discountPercent > 0 ? [{
      coupon: await createOrGetCoupon(discountPercent),
    }] : [];

    // Create checkout session with optional user_id (for guest checkout support)
    const metadata: any = {
      discount_code: normalizedDiscountCode,
      coupon_product_id: quickBooksCoupon?.product_id || '',
      discount_percent: discountPercent.toString(),
      tax_amount: taxAmount.toString(),
      subtotal: subtotal.toString(),
      total: total.toString(),
      customer_info: JSON.stringify(customerInfo),
      customer_first_name: customerInfo.firstName || '',
      customer_last_name: customerInfo.lastName || '',
      items: JSON.stringify(items.map((item: any) => ({
        product_slug: item.product_slug || item.id || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        product_id: item.product_id || null,
        bundle_id: item.bundle_id || null,
        purchased_item: item.purchased_item || null,
        purchased_item_price: item.purchased_item_price || null,
      }))),
    };

    // Add user_id if authenticated
    if (userId) {
      metadata.user_id = userId;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      discounts,
      mode: 'payment',
      customer_email: customerEmail,
      metadata,
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

async function getValidQuickBooksCoupon(
  supabase: any,
  code: string,
  email: string,
  items: any[],
) {
  if (!code.startsWith('CLS-') || !email || items.length !== 1) return null;

  const item = items[0];
  if (item.product_slug !== 'course-operational-success-academy') return null;

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('id, product_id, email, status, used_count, max_uses, expires_at')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('QuickBooks coupon checkout lookup failed:', error);
    return null;
  }

  const isExpired = coupon?.expires_at && new Date(coupon.expires_at).getTime() <= Date.now();
  const emailMatches = coupon?.email?.toLowerCase() === email.trim().toLowerCase();
  const usesAvailable = coupon && coupon.used_count < coupon.max_uses;

  if (!coupon || !emailMatches || coupon.status !== 'ACTIVE' || !usesAvailable || isExpired) {
    return null;
  }

  return coupon;
}

function getDiscountPercent(code: string): number {
  const validCodes: { [key: string]: number } = {
    SAVE10: 10,
    SAVE15: 15,
    LAUNCH20: 20,
    WELCOME5: 5,
  };

  if (!code) return 0;
  return validCodes[code.toUpperCase()] || 0;
}

async function createOrGetCoupon(percent: number): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");

  const couponId = `discount_${percent}`;

  try {
    // Try to get existing coupon
    const coupon = await stripe.coupons.retrieve(couponId);
    return coupon.id;
  } catch {
    // Create new coupon if it doesn't exist
    const coupon = await stripe.coupons.create({
      id: couponId,
      percent_off: percent,
      duration: 'once',
    });
    return coupon.id;
  }
}
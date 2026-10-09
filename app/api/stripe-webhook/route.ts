import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig!, endpointSecret!);
    } catch (err: any) {
      console.error(`Webhook signature verification failed.`, err.message);
      return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Log the webhook event
    await supabase.from('webhooks').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event.data,
    });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  try {
    const userId = session.metadata?.user_id;
    const isCourseEnrollment = session.metadata?.enrollment_type === 'course' || 
                               session.metadata?.course_type === 'operational-success-academy';
    
    console.log('📋 Checkout session completed:');
    console.log('  - enrollment_type:', session.metadata?.enrollment_type);
    console.log('  - course_type:', session.metadata?.course_type);
    console.log('  - isCourseEnrollment:', isCourseEnrollment);
    console.log('  - userId:', userId);
    console.log('  - session.customer_details?.email:', session.customer_details?.email);
    
    // For course enrollments and guest checkouts, user_id is optional
    // Both will now be supported (public checkout)
    const isGuestCheckout = !userId;
    
    console.log('  - isGuestCheckout:', isGuestCheckout);

    const discountCode = session.metadata?.discount_code || '';
    const discountPercent = parseFloat(session.metadata?.discount_percent || '0');
    const taxAmount = parseFloat(session.metadata?.tax_amount || '0');
    const subtotal = parseFloat(session.metadata?.subtotal || '0');
    const total = parseFloat(session.metadata?.total || '0');
    const customerInfo = JSON.parse(session.metadata?.customer_info || '{}');
    const items = JSON.parse(session.metadata?.items || '[]');
    const courseEmail = session.customer_details?.email || session.metadata?.customer_email || customerInfo.email;

    console.log(`📦 Processing checkout for ${isCourseEnrollment ? 'course' : `user ${userId}`} with ${items.length} item(s):`, items);
    
    // DEBUG: Log each item's purchased_item field
    console.log('🔍 DEBUG - Items from Stripe metadata:');
    items.forEach((item: any, idx: number) => {
      console.log(`  [${idx}] purchased_item: "${item.purchased_item}" | type: ${typeof item.purchased_item}`);
    });

    const enrichedItems: any[] = [];

    for (const item of items) {
      const quantity = item.quantity || 1;
      const unitAmount = item.price || 0;
      const lineTotal = unitAmount * quantity;

      let product: any = null;
      const watchFields: string[] = [];
      if (item.product_slug) watchFields.push(`product_slug.eq.${item.product_slug}`);
      if (item.name) watchFields.push(`name.eq.${item.name}`);
      if (item.stripe_price_id) watchFields.push(`stripe_price_id.eq.${item.stripe_price_id}`);

      if (watchFields.length > 0) {
        const { data } = await supabase
          .from('products')
          .select('id, product_slug, name, stripe_product_id, stripe_price_id, skool_group_id, skool_course_id, ghl_tag')
          .or(watchFields.join(','))
          .maybeSingle();

        product = data;
      }

      const enrichedItem = {
        product_slug: item.product_slug || null,
        name: item.name || null,
        quantity,
        unit_amount: unitAmount,
        line_total: lineTotal,
        stripe_price_id: product?.stripe_price_id || item.stripe_price_id || null,
        stripe_product_id: product?.stripe_product_id || null,
        skool_group_id: product?.skool_group_id || null,
        skool_course_id: product?.skool_course_id || null,
        ghl_tag: product?.ghl_tag || null,
        product_id: product?.id || null,
        // Track individually purchased items - from Stripe metadata items
        purchased_item: item.purchased_item || null,
        purchased_item_price: item.purchased_item_price || null,
      };

      console.log(`🏷️ Enriched item ${item.name}:`, {
        purchased_item_from_item: item.purchased_item,
        purchased_item_in_enriched: enrichedItem.purchased_item,
        product_id: enrichedItem.product_id,
      });

      if (item.purchased_item) {
        console.log(`📍 Individual item purchase detected:`, {
          name: enrichedItem.name,
          purchased_item: enrichedItem.purchased_item,
          purchased_item_price: enrichedItem.purchased_item_price,
          product_id: enrichedItem.product_id,
        });
      }

      if (!enrichedItem.product_id) {
        console.warn(`⚠️ Could not resolve product_id for item:`, { item, watchFields, product });
      } else {
        console.log(`✓ Resolved product_id ${enrichedItem.product_id} for item: ${enrichedItem.name}`);
      }

      enrichedItems.push(enrichedItem);
    }

    // Collect purchased_items mapping from enriched items
    // This maps product_id to array of purchased item names
    const purchasedItemsByProductId: Record<string, string[]> = {};
    
    console.log('🔍 Building purchased_items_map from enrichedItems:');
    for (const item of enrichedItems) {
      console.log(`  Item: ${item.name}`, {
        product_id: item.product_id,
        purchased_item: item.purchased_item,
        has_purchased_item: !!item.purchased_item,
      });
      
      if (item.product_id && item.purchased_item) {
        if (!purchasedItemsByProductId[item.product_id]) {
          purchasedItemsByProductId[item.product_id] = [];
        }
        purchasedItemsByProductId[item.product_id].push(item.purchased_item);
        console.log(`    ✓ Added to map for product ${item.product_id}`);
      }
    }
    
    console.log('📦 Final Purchased items mapping by product:', purchasedItemsByProductId);

    // Update or create purchase record
    const purchaseData: any = {
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      amount: total,
      discount_code: discountCode,
      discount_amount: (subtotal * discountPercent) / 100,
      tax_amount: taxAmount,
      status: 'completed',
      metadata: {
        customer_email: courseEmail,
        customer_name: session.customer_details?.name || `${session.customer_details?.name || ''}`.trim() || 'Course Enrollee',
        customer_info: customerInfo,
        items: enrichedItems,
        stripe_session: session,
      },
    };

    // Include user_id if available
    if (userId) {
      purchaseData.user_id = userId;
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .upsert(purchaseData)
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
      return;
    }

    // ✅ SAVE PURCHASED_ITEMS DIRECTLY WITHOUT WAITING TO READ FROM DB
    // Grant product access only if user is logged in
    if (userId) {
      console.log('💾 DIRECT SAVE: Using purchasedItemsByProductId built from enrichedItems');
      console.log('💾 Map contents:', purchasedItemsByProductId);
      
      // Group items by product_id to avoid UNIQUE constraint violations
      const itemsByProductId = enrichedItems.reduce((acc: Record<string, any[]>, item: any) => {
        if (item.product_id) {
          if (!acc[item.product_id]) {
            acc[item.product_id] = [];
          }
          acc[item.product_id].push(item);
        }
        return acc;
      }, {});

      const grantErrors: any[] = [];
      
      for (const [productId, items] of Object.entries(itemsByProductId)) {
        // Use the map we just built - DON'T read from purchase.metadata
        const purchasedItems = purchasedItemsByProductId[productId] || [];
        
        console.log(`💾 DIRECT SAVE for product ${productId}:`, {
          purchasedItems,
          fromMap: purchasedItemsByProductId[productId],
          itemCount: items.length,
        });
        
        // Create or update user_products entry with purchased_items
        const { error: grantError } = await supabase
          .from('user_products')
          .upsert({
            user_id: userId,
            product_id: productId,
            purchase_id: purchase.id,
            granted_at: new Date().toISOString(),
            is_active: true,
            purchased_items: purchasedItems.length > 0 ? purchasedItems : null,
          });

        if (grantError) {
          console.error(`Failed to grant access to product ${productId}:`, grantError);
          grantErrors.push({ product_id: productId, error: grantError, items: items });
        } else {
          const purchaseType = purchasedItems.length > 0 ? 'individual_items' : 'complete_bundle';
          console.log(`✓ Granted ${purchaseType} access to product ${productId}`);
        }
      }

      if (grantErrors.length > 0) {
        console.error(`⚠️ WARNING: Purchase ${purchase.id} completed but ${grantErrors.length} product(s) failed to grant access:`, grantErrors);
      } else {
        console.log(`✓ All ${Object.keys(itemsByProductId).length} product(s) access granted for purchase ${purchase.id}`);
      }

      // Update profile with customer info if provided
      if (customerInfo.firstName || customerInfo.lastName || customerInfo.company || customerInfo.phone) {
        await supabase
          .from('profiles')
          .update({
            first_name: customerInfo.firstName,
            last_name: customerInfo.lastName,
            company: customerInfo.company,
            phone: customerInfo.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    }

    if (isCourseEnrollment && discountCode.startsWith('CLS-')) {
      await redeemQuickBooksCoupon(supabase, discountCode, courseEmail, session.metadata?.coupon_product_id, purchase.id);
    }

    const skoolCourseIds = enrichedItems
      .map((item) => item.skool_course_id)
      .filter((id) => id) as string[];

    // Send data to Zapier webhook for automations
    await sendToZapier({
      event: 'checkout.session.completed',
      user_id: userId,
      purchase_id: purchase.id,
      customer_email: courseEmail,
      customer_first_name: session.customer_details?.name?.split(' ')[0] || customerInfo.firstName || null,
      customer_last_name: session.customer_details?.name?.split(' ').slice(1).join(' ') || customerInfo.lastName || null,
      customer_name: session.customer_details?.name || `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
      products: enrichedItems,
      skool_course_ids: skoolCourseIds,
      skool_course_ids_string: skoolCourseIds.join(', '),
      total_amount: total,
      currency: session.currency || 'usd',
      discount_code: discountCode || null,
      discount_percent: discountPercent,
      tax_amount: taxAmount,
      subtotal: subtotal,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_customer_id: session.customer as string,
      purchase_date: new Date().toISOString(),
      // Course-specific fields
      is_course_enrollment: isCourseEnrollment,
      course_type: session.metadata?.course_type || null,
      course_email: courseEmail,
    });

    // Handle course enrollment specific automations
    if (isCourseEnrollment) {
      console.log(`🎓 Course Enrollment Detected for ${courseEmail}`);
      
      // Send course enrollment to external automation service
      await handleCourseEnrollmentAutomation({
        user_id: userId,
        purchase_id: purchase.id,
        customer_email: courseEmail,
        customer_name: session.customer_details?.name || `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
        course_type: session.metadata?.course_type || 'operational-success-academy',
        amount: total,
        stripe_session_id: session.id,
      });
    }

    // Mark webhook as processed
    await supabase
      .from('webhooks')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', session.id);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);

    // Mark webhook as failed
    await supabase
      .from('webhooks')
      .update({
        processed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('stripe_event_id', session.id);
  }
}

async function redeemQuickBooksCoupon(
  supabase: any,
  code: string,
  email: string | undefined,
  productId: string | undefined,
  purchaseId: string,
) {
  if (!email || !productId) {
    console.error('QuickBooks coupon redemption skipped: missing email or product ID', {
      code,
      purchaseId,
    });
    return;
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .update({
      status: 'USED',
      used_count: 1,
      used_at: new Date().toISOString(),
    })
    .eq('code', code)
    .eq('email', email.toLowerCase())
    .eq('product_id', productId)
    .eq('status', 'ACTIVE')
    .eq('used_count', 0)
    .select('id, code, status, used_at')
    .maybeSingle();

  if (error) {
    console.error('QuickBooks coupon redemption failed:', { error, code, purchaseId });
    return;
  }

  if (!coupon) {
    console.error('QuickBooks coupon was not redeemed because it is invalid or already used', {
      code,
      purchaseId,
    });
    return;
  }

  console.log('QuickBooks coupon permanently marked USED', {
    couponId: coupon.id,
    code,
    purchaseId,
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  // Update purchase status to failed
  await supabase
    .from('purchases')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

async function sendToZapier(data: any) {
  const zapierUrl = process.env.ZAPIER_WEBHOOK_URL;

  if (!zapierUrl) {
    console.warn('Zapier webhook URL not configured');
    return;
  }

  try {
    const response = await fetch(zapierUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to send data to Zapier:', response.statusText);
    } else {
      console.log('Successfully sent data to Zapier');
    }
  } catch (error) {
    console.error('Error sending data to Zapier:', error);
  }
}

async function handleCourseEnrollmentAutomation(data: {
  user_id?: string;
  purchase_id: string;
  customer_email: string;
  customer_name: string;
  course_type: string;
  amount: number;
  stripe_session_id: string;
}) {
  /**
   * This function handles course enrollment automations:
   * 1. Sends Skool course invite email to the customer
   * 2. Triggers GHL automation (Go High Level)
   * 3. Tags contact in GHL with course enrollment tag
   * 4. Adds to GHL course pipeline
   */

  console.log('🚀 handleCourseEnrollmentAutomation called with data:', {
    customer_email: data.customer_email,
    customer_name: data.customer_name,
    course_type: data.course_type,
    has_user_id: !!data.user_id,
  });

  try {
    // Send to Go High Level API if configured
    const ghlWebhookUrl = process.env.GHL_WEBHOOK_URL;
    console.log('GHL_WEBHOOK_URL configured:', !!ghlWebhookUrl);
    if (ghlWebhookUrl) {
      console.log(`📤 Sending course enrollment to GHL for ${data.customer_email}`);
      
      const ghlData = {
        event_type: 'course_enrollment',
        contact_email: data.customer_email,
        contact_name: data.customer_name,
        course_type: data.course_type,
        purchase_id: data.purchase_id,
        enrollment_date: new Date().toISOString(),
        amount: data.amount,
        stripe_session_id: data.stripe_session_id,
      };

      try {
        const ghlResponse = await fetch(ghlWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ghlData),
        });

        if (ghlResponse.ok) {
          console.log('✓ Successfully sent to GHL');
        } else {
          console.error('Failed to send to GHL:', ghlResponse.statusText);
        }
      } catch (error) {
        console.error('Error sending to GHL:', error);
      }
    }

    // Send Skool invite via Zapier if configured
    const skoolZapierUrl = process.env.SKOOL_INVITE_WEBHOOK_URL || process.env.ZAPIER_WEBHOOK_URL;
    console.log('SKOOL_INVITE_WEBHOOK_URL:', !!process.env.SKOOL_INVITE_WEBHOOK_URL);
    console.log('ZAPIER_WEBHOOK_URL:', !!process.env.ZAPIER_WEBHOOK_URL);
    console.log('Final skoolZapierUrl:', skoolZapierUrl);
    
    if (skoolZapierUrl) {
      console.log(`📧 Sending Skool course invite to ${data.customer_email}`);
      
      const skoolData = {
        event: 'course_enrollment_send_skool_invite',
        customer_email: data.customer_email,
        customer_name: data.customer_name,
        course_type: data.course_type,
        course_name: 'Care Licensing Solutions Operational Success Academy',
        purchase_id: data.purchase_id,
        enrollment_date: new Date().toISOString(),
      };

      console.log('📨 Sending payload to Zapier:', JSON.stringify(skoolData, null, 2));

      try {
        const skoolResponse = await fetch(skoolZapierUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(skoolData),
        });

        const responseText = await skoolResponse.text();
        console.log(`Zapier response status: ${skoolResponse.status}`);
        console.log(`Zapier response body: ${responseText}`);

        if (skoolResponse.ok) {
          console.log('✓ Skool invite sent successfully to Zapier');
        } else {
          console.error('Failed to send Skool invite to Zapier:', skoolResponse.statusText);
        }
      } catch (error) {
        console.error('Error sending Skool invite to Zapier:', error);
      }
    } else {
      console.error('⚠️ No Zapier webhook URL configured (SKOOL_INVITE_WEBHOOK_URL or ZAPIER_WEBHOOK_URL)');
    }

  } catch (error) {
    console.error('Error handling course enrollment automation:', error);
  }
}
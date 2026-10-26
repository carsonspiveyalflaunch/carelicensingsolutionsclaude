import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";
import { resolveProductForItem } from "@/lib/resolve-product";
import { readItemsMetadata } from "@/lib/stripe-items";
import { orderTotals, buyerName } from "@/lib/stripe-order";
import { upsertProductAccess } from "@/lib/purchase-access";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

async function grantAccessForPurchase(
  supabase: any,
  userId: string,
  purchaseId: string,
  items: any[],
  purchasedItemsMap?: Record<string, string[]>
) {
  const results: any[] = [];

  // Resolve every item to a real product first (cart items don't always carry
  // a product id), then group so each product is granted once.
  const itemsByProductId: Record<string, any[]> = {};
  const productsById: Record<string, any> = {};
  for (const item of items) {
    const resolved = await resolveProductForItem(supabase, item);
    if (!resolved?.id) {
      results.push({ items: [item], success: false, reason: 'Unable to resolve product' });
      continue;
    }
    productsById[resolved.id] = resolved;
    (itemsByProductId[resolved.id] ||= []).push(item);
  }

  for (const [productId, productItems] of Object.entries(itemsByProductId)) {
    const product = productsById[productId];

    // Get purchased items from map if provided, otherwise try to extract from items
    const purchasedItems = purchasedItemsMap && purchasedItemsMap[product.id]
      ? purchasedItemsMap[product.id]
      : productItems
          .filter((item: any) => item.purchased_item)
          .map((item: any) => item.purchased_item);

    console.log(`💾 Storing purchased_items for product ${product.id}:`, {
      purchasedItems,
      itemCount: productItems.length,
    });

    const error = await upsertProductAccess(supabase, {
      userId,
      productId: product.id,
      purchaseId,
      purchasedItems: purchasedItems.length > 0 ? purchasedItems : null,
    });

    if (error) {
      results.push({ product_id: product.id, items: productItems, success: false, error });
    } else {
      const purchaseType = purchasedItems.length > 0 ? 'individual_items' : 'complete_bundle';
      results.push({ product_id: product.id, items: productItems, success: true, purchase_type: purchaseType });
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
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

    // Get user if authenticated, but allow guest checkout verification
    let user: any = null;
    if (accessToken) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);
      if (!authError && authUser) {
        user = authUser;
      }
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get purchase details by session ID first.
    // Ownership/claim checks are handled after fetch so guest purchases can be
    // attached to a newly authenticated user on the success page.
    const query = supabase
      .from('purchases')
      .select(`
        id,
        amount,
        status,
        created_at,
        user_id,
        metadata,
        user_products (
          product_id,
          products (
            name,
            type
          )
        )
      `)
      .eq('stripe_session_id', sessionId);

    let { data: purchase, error: purchaseError }:
      { data: any | null; error: any } = await query
      .single();

    // Initialize purchasedItemsMap early, to be available in all paths
    let purchasedItemsMap: Record<string, string[]> = {};

    if (purchaseError || !purchase) {
      if (!stripe) {
        return NextResponse.json(
          { error: "Purchase not found" },
          { status: 404 }
        );
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // 100%-off orders complete as 'no_payment_required' and must unlock too.
      if (!session || session.status !== 'complete' || !['paid', 'no_payment_required'].includes(session.payment_status)) {
        return NextResponse.json(
          { error: "Purchase not found" },
          { status: 404 }
        );
      }

      // For course enrollments, don't require user_id match (public checkout)
      // For product purchases, require user_id match if user is authenticated
      const isCourseEnrollment = session.metadata?.enrollment_type === 'course' || 
                                 session.metadata?.course_type === 'operational-success-academy';
      const sessionCustomerInfo = JSON.parse(session.metadata?.customer_info || '{}');
      const sessionEmail =
        session.customer_details?.email ||
        session.metadata?.customer_email ||
        sessionCustomerInfo.email ||
        null;
      const userEmail = user?.email || null;
      
      if (!isCourseEnrollment && user) {
        const metadataUserId = session.metadata?.user_id;

        // If checkout was tied to a user_id, enforce exact ownership.
        if (metadataUserId && metadataUserId !== user.id) {
          return NextResponse.json(
            { error: "Purchase not found" },
            { status: 404 }
          );
        }

        // If checkout was guest (no user_id), allow claim only when emails match.
        if (!metadataUserId) {
          const emailMatches =
            !!sessionEmail &&
            !!userEmail &&
            sessionEmail.toLowerCase() === userEmail.toLowerCase();

          if (!emailMatches) {
            return NextResponse.json(
              { error: "Purchase not found" },
              { status: 404 }
            );
          }
        }
      }

      const customerInfo = sessionCustomerInfo;
      const items = readItemsMetadata(session.metadata);

      // Build purchased_items map directly from items
      for (const item of items) {
        if (item.product_id && item.purchased_item) {
          if (!purchasedItemsMap[item.product_id]) {
            purchasedItemsMap[item.product_id] = [];
          }
          purchasedItemsMap[item.product_id].push(item.purchased_item);
          console.log(`✓ Added purchased_item "${item.purchased_item}" for product ${item.product_id}`);
        }
      }
      
      console.log('📦 Purchased items map from items:', purchasedItemsMap);
      const discountPercent = parseFloat(session.metadata?.discount_percent || '0');
      const taxAmount = parseFloat(session.metadata?.tax_amount || '0');
      const subtotal = parseFloat(session.metadata?.subtotal || '0');
      const paid = await orderTotals(stripe, session);
      const total = paid.total;
      const discountCode = paid.discountCode;
      const courseEmail = session.customer_details?.email || session.metadata?.customer_email || customerInfo.email;

      const purchaseData: any = {
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: total,
        discount_code: discountCode,
        discount_amount: paid.discountAmount,
        tax_amount: taxAmount,
        status: 'completed',
        metadata: {
          customer_email: courseEmail,
          customer_name: buyerName(session, customerInfo, courseEmail),
          customer_info: customerInfo,
          items,
          stripe_session: session,
        },
      };

      // Only add user_id if user is authenticated
      if (user) {
        purchaseData.user_id = user.id;
      }

      const { data: insertedPurchase, error: insertError } = await supabase
        .from('purchases')
        .upsert(purchaseData)
        .select()
        .single();

      if (insertError || !insertedPurchase) {
        console.error('Error creating fallback purchase record:', insertError);
        return NextResponse.json(
          { error: "Purchase not found" },
          { status: 404 }
        );
      }

      purchase = insertedPurchase;

      // Only grant access if user is authenticated
      if (user) {
        const grantResults = await grantAccessForPurchase(
          supabase,
          user.id,
          purchase.id,
          items,
          purchasedItemsMap,
        );
        console.log('verify-purchase granted access for fallback purchase:', grantResults);
      }
    } else if (user) {
      // Purchase row exists. Enforce ownership and allow guest-purchase claim by email.
      if (purchase.user_id && purchase.user_id !== user.id) {
        return NextResponse.json(
          { error: "Purchase not found" },
          { status: 404 }
        );
      }

      if (!purchase.user_id) {
        const purchaseEmail =
          purchase.metadata?.customer_email ||
          purchase.metadata?.customer_info?.email ||
          null;
        const userEmail = user.email || null;
        const emailMatches =
          !!purchaseEmail &&
          !!userEmail &&
          purchaseEmail.toLowerCase() === userEmail.toLowerCase();

        if (!emailMatches) {
          return NextResponse.json(
            { error: "Purchase not found" },
            { status: 404 }
          );
        }

        const { data: claimedPurchase, error: claimError } = await supabase
          .from('purchases')
          .update({ user_id: user.id })
          .eq('id', purchase.id)
          .is('user_id', null)
          .select(`
            id,
            amount,
            status,
            created_at,
            user_id,
            metadata,
            user_products (
              product_id,
              products (
                name,
                type
              )
            )
          `)
          .single();

        if (claimError || !claimedPurchase) {
          console.error('Failed to claim guest purchase for user:', claimError);
          return NextResponse.json(
            { error: "Purchase not found" },
            { status: 404 }
          );
        }

        purchase = claimedPurchase;
      }
    }

    if (purchase.status !== 'completed') {
      return NextResponse.json(
        { error: "Purchase is not completed" },
        { status: 400 }
      );
    }

    if ((!purchase.user_products || purchase.user_products.length === 0) && purchase.metadata?.items) {
      const items = Array.isArray(purchase.metadata.items)
        ? purchase.metadata.items
        : JSON.parse(purchase.metadata.items || '[]');

      // Build purchased_items map from items
      for (const item of items) {
        if (item.product_id && item.purchased_item) {
          if (!purchasedItemsMap[item.product_id]) {
            purchasedItemsMap[item.product_id] = [];
          }
          purchasedItemsMap[item.product_id].push(item.purchased_item);
        }
      }

      // Only grant access if user is authenticated
      if (user) {
        const grantResults = await grantAccessForPurchase(
          supabase,
          user.id,
          purchase.id,
          items,
          purchasedItemsMap,
        );
        console.log('verify-purchase granted access for existing purchase:', grantResults);
      }
    }

    return NextResponse.json({
      purchase_id: purchase.id,
      amount: purchase.amount,
      status: purchase.status,
      created_at: purchase.created_at,
      products: purchase.user_products?.map((up: any) => up.products) || [],
      // Skool community comes with bundles and the course, not single resources.
      includes_community: (Array.isArray(purchase.metadata?.items) ? purchase.metadata.items : []).some((item: any) => {
        if (item?.purchased_item) return false;
        const slug = String(item?.product_slug || '');
        return slug.endsWith('-complete-bundle') || slug.startsWith('bundle-') || slug.startsWith('course-');
      }),
    });
  } catch (error: any) {
    console.error("Purchase verification failed:", error);
    return NextResponse.json(
      { error: "Failed to verify purchase" },
      { status: 500 }
    );
  }
}
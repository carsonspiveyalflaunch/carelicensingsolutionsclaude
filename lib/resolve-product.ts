/**
 * Find the products row a cart / Stripe-metadata item refers to.
 *
 * Cart items come from several pages and don't all carry a real product id.
 * The bundles page, for example, sends "bundle-<STATE CODE>-<program>". This
 * resolves every shape to a single products row so access can be granted.
 *
 * Each lookup is a separate .eq() query on purpose: product names contain
 * parentheses and commas ("Nursing Facilities (SNF)") that break PostgREST
 * .or() filter strings.
 */

const SELECT =
  'id, product_slug, name, price, type, stripe_product_id, stripe_price_id, skool_group_id, skool_course_id, ghl_tag';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function firstWhere(supabase: any, column: string, value: string) {
  const { data } = await supabase
    .from('products')
    .select(SELECT)
    .eq(column, value)
    .limit(1)
    .maybeSingle();
  return data || null;
}

export async function resolveProductForItem(supabase: any, item: any) {
  if (!item) return null;

  const productId = typeof item.product_id === 'string' ? item.product_id : '';
  if (UUID.test(productId)) {
    const byId = await firstWhere(supabase, 'id', productId);
    if (byId) return byId;
  }

  const id = typeof item.id === 'string' ? item.id : '';
  if (UUID.test(id)) {
    const byItemId = await firstWhere(supabase, 'id', id);
    if (byItemId) return byItemId;
  }

  const slug =
    (typeof item.product_slug === 'string' && item.product_slug) || id || '';

  if (slug) {
    const bySlug = await firstWhere(supabase, 'product_slug', slug);
    if (bySlug) return bySlug;

    // Bundles page: "bundle-<STATE CODE>-<program type>".
    const generic = slug.match(/^bundle-([A-Za-z]{2})-(.+)$/);
    if (generic) {
      const { data } = await supabase
        .from('products')
        .select(SELECT)
        .eq('type', 'bundle')
        .eq('code', generic[1].toUpperCase())
        .eq('program', generic[2])
        .eq('product_label', 'Complete Bundle')
        .limit(1)
        .maybeSingle();
      if (data) return data;
    }
  }

  if (typeof item.stripe_price_id === 'string' && item.stripe_price_id) {
    const byPrice = await firstWhere(supabase, 'stripe_price_id', item.stripe_price_id);
    if (byPrice) return byPrice;
  }

  if (typeof item.name === 'string' && item.name) {
    const byName = await firstWhere(supabase, 'name', item.name);
    if (byName) return byName;
  }

  return null;
}

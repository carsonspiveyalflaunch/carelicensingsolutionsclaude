import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/utils/supabase-server';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createServerSupabaseClient();

  const [productsCountRes, coursesCountRes, bundlesCountRes, purchasesCountRes, usersCountRes, accessCountRes, recentProductsRes, bundleProductsRes] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).ilike('type', 'course'),
    supabase.from('products').select('id', { count: 'exact', head: true }).ilike('type', 'bundle'),
    supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id, name, type, price, created_at, metadata').order('created_at', { ascending: false }).limit(4),
    supabase.from('products').select('id, name, type, price, created_at, metadata').ilike('type', 'bundle').order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    productsCount: productsCountRes.count || 0,
    coursesCount: coursesCountRes.count || 0,
    bundlesCount: bundlesCountRes.count || 0,
    purchasesCount: purchasesCountRes.count || 0,
    usersCount: usersCountRes.count || 0,
    accessCount: accessCountRes.count || 0,
    recentProducts: recentProductsRes.data || [],
    bundleProducts: bundleProductsRes.data || [],
  });
}

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/utils/supabase-server';

/**
 * Gate for admin API routes.
 *
 * Returns null when the request carries a valid Supabase access token that
 * belongs to an active admin. Otherwise returns the response to send back.
 * Every handler under /api/admin and /api/admin-stats must call this first,
 * because those handlers use the service-role client, which bypasses RLS.
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin || profile.is_active === false) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}

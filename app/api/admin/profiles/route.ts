import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/utils/supabase-server';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 },
    );
  }

  const supabase = createServerSupabaseClient();
  // Fetch profiles from the public table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, is_admin, created_at, is_active')
    .order('created_at', { ascending: false })
    .limit(50);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // Return profiles including is_active flag (true = activated)
  const users = (profiles ?? []).map((p: any) => ({ ...p, is_active: p.is_active !== false }));
  return NextResponse.json({ users });
}

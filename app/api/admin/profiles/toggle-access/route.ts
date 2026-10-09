import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/utils/supabase-server';

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const userId = body?.userId;
    const action = body?.action; // 'disable' or 'enable'

    if (!userId || !['disable', 'enable'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Toggle profiles.is_active for the given user id
    const isActive = action === 'enable';

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select('id,is_active')
      .single();

    if (error) {
      console.error('toggle-access error', error.message || error);
      return NextResponse.json({ error: error.message || 'Unable to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_active: data?.is_active ?? isActive });
  } catch (err: any) {
    console.error('toggle-access exception', err?.message || err);
    return NextResponse.json({ error: err?.message || 'unknown' }, { status: 500 });
  }
}

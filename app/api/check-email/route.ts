import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || '').toString().trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const supabase = createServerSupabaseClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email')
      .eq('email', email)
      .single();

    if (!profileError && profile) {
      return NextResponse.json({ exists: true, userId: profile.id });
    }

    // Fallback for users that exist in Supabase auth but may not have a profile entry yet.
    try {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (!usersError && usersData?.users) {
        const matching = usersData.users.find((user) => user.email?.toLowerCase() === email);
        if (matching) {
          return NextResponse.json({ exists: true, userId: matching.id });
        }
      }
    } catch (adminError) {
      console.warn('check-email admin.listUsers fallback failed:', adminError);
    }

    return NextResponse.json({ exists: false });
  } catch (err: any) {
    console.error('check-email exception', err?.message || err);
    return NextResponse.json({ exists: false, error: err?.message || 'unknown' }, { status: 500 });
  }
}

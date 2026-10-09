import { supabase } from '@/utils/supabase';

/**
 * fetch() for the admin panel: attaches the signed-in user's access token so
 * the admin API routes can verify the caller (see utils/admin-auth.ts).
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

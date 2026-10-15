import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { claimPurchasesForUser } from "@/lib/purchase-access";

// Called by the dashboard on load: links any purchases made with the signed-in
// user's email (e.g. guest checkouts) to their account.
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const claimed = await claimPurchasesForUser(supabase, user.id, user.email);
  return NextResponse.json({ claimed });
}

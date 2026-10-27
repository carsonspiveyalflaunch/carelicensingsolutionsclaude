import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";
import { isTrustedCatalogName } from "@/lib/tracking-params";
import type { FunnelBundle } from "@/lib/meta-funnel";

const SELECT = "id, product_slug, name, price, state, code, program";

export type CompleteBundle = FunnelBundle & { price: number };

function anonReader() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Service role first, then the public anon key. A rejected service-role key must not hide the catalog. */
export function catalogClients(): SupabaseClient[] {
  const clients: SupabaseClient[] = [];
  if (isSupabaseConfigured()) {
    try {
      clients.push(createServerSupabaseClient());
    } catch (err) {
      console.error("Complete bundle service-role client unavailable:", err);
    }
  }
  const anon = anonReader();
  if (anon) clients.push(anon);
  return clients;
}

type ProductRow = {
  id?: string;
  name?: string;
  price?: number | string;
  state?: string;
  code?: string;
  program?: string;
  product_slug?: string;
};

function normalizeRows(rows: ProductRow[] | null): CompleteBundle[] {
  const seen = new Set<string>();
  const kits: CompleteBundle[] = [];
  for (const row of rows || []) {
    const id = typeof row.id === "string" ? row.id : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const code = typeof row.code === "string" ? row.code.trim().toUpperCase() : "";
    const program = typeof row.program === "string" ? row.program.trim() : "";
    const slug = typeof row.product_slug === "string" ? row.product_slug.trim() : "";
    const price = Number(row.price);
    if (!id || !isTrustedCatalogName(name) || !slug || !code || !program || !Number.isFinite(price) || price <= 0) continue;
    const key = `${code}|${program}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kits.push({
      id,
      product_slug: slug,
      name,
      price,
      state: typeof row.state === "string" && row.state.trim() ? row.state.trim() : code,
      code,
      program,
    });
  }
  kits.sort((a, b) => a.state.localeCompare(b.state) || a.program.localeCompare(b.program));
  return kits;
}

async function queryBundles(supabase: SupabaseClient): Promise<CompleteBundle[]> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("type", "bundle")
    .eq("is_active", true)
    .eq("product_label", "Complete Bundle")
    .like("product_slug", "%complete-bundle");
  if (error) throw error;
  return normalizeRows((data || []) as ProductRow[]);
}

/** Public catalog of complete state bundles. Same source as /launch-kit. */
export async function loadCompleteBundles(): Promise<CompleteBundle[]> {
  if (isSupabaseConfigured()) {
    try {
      const kits = await queryBundles(createServerSupabaseClient());
      if (kits.length) return kits;
    } catch (err) {
      console.error("Complete bundle service-role read failed:", err);
    }
  }
  const anon = anonReader();
  if (!anon) return [];
  return queryBundles(anon);
}

export async function findCompleteBundle(
  supabase: SupabaseClient,
  code: string,
  program: string,
): Promise<CompleteBundle | null> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("type", "bundle")
    .eq("is_active", true)
    .eq("product_label", "Complete Bundle")
    .eq("code", code)
    .eq("program", program)
    .like("product_slug", "%complete-bundle")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const [bundle] = normalizeRows(data ? [data as ProductRow] : []);
  return bundle || null;
}

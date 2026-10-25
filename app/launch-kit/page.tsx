import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LaunchKitView, { type LaunchKitProduct } from "./LaunchKitView";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/utils/supabase-server";
import { pageMeta, SITE_NAME, SITE_URL } from "@/lib/seo";
import { isTrustedCatalogName } from "@/lib/tracking-params";
import { STANDARD_BUNDLE_PRICE } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta(
  "/launch-kit",
  "Care Business Launch Kit | Care Licensing Solutions",
  "The $997 Care Business Launch Kit: state-specific market research, pro forma P&L, licensing checklist, and policy manual. Instant download. Checkout on this page.",
);

const SELECT = "id, product_slug, name, price, state, code, program";

function anonReader() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function queryLaunchKits(supabase: ReturnType<typeof createServerSupabaseClient>): Promise<LaunchKitProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("type", "bundle")
    .eq("is_active", true)
    .eq("product_label", "Complete Bundle")
    .like("product_slug", "%complete-bundle");
  if (error) throw error;
  const seen = new Set<string>();
  const kits: LaunchKitProduct[] = [];
  for (const row of data || []) {
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const code = typeof row.code === "string" ? row.code.trim().toUpperCase() : "";
    const program = typeof row.program === "string" ? row.program.trim() : "";
    const slug = typeof row.product_slug === "string" ? row.product_slug.trim() : "";
    const price = Number(row.price);
    if (!isTrustedCatalogName(name) || !slug || !code || !program || !Number.isFinite(price) || price <= 0) continue;
    const key = `${code}|${program}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kits.push({
      id: row.id,
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

async function loadLaunchKits(): Promise<LaunchKitProduct[]> {
  // Prefer the service role. Preview has had an unusable service-role value, and
  // this catalog is publicly readable, so fall back to the anon key.
  if (isSupabaseConfigured()) {
    try {
      const kits = await queryLaunchKits(createServerSupabaseClient());
      if (kits.length) return kits;
    } catch (err) {
      console.error("Launch Kit service-role read failed:", err);
    }
  }
  const anon = anonReader();
  if (!anon) return [];
  return queryLaunchKits(anon);
}

export default async function LaunchKitPage() {
  let products: LaunchKitProduct[] = [];
  try {
    products = await loadLaunchKits();
  } catch (err) {
    console.error("Launch Kit catalog failed:", err);
  }
  const price = products[0]?.price || STANDARD_BUNDLE_PRICE;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Care Business Launch Kit",
    description:
      "State-specific market research report, pro forma P&L, licensing checklist, and policy & procedure manual for opening a licensed care business.",
    brand: { "@type": "Brand", name: SITE_NAME },
    url: `${SITE_URL}/launch-kit`,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "USD",
      availability: products.length ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/launch-kit`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <Suspense fallback={<div className="bg-white px-4 py-32 text-center text-slate-600">Loading the Launch Kit…</div>}>
        <LaunchKitView products={products} listPrice={price} />
      </Suspense>
      <Footer />
    </>
  );
}

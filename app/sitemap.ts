import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { goSlug } from "@/lib/go-links";
import { createServerSupabaseClient } from "@/utils/supabase-server";

export const revalidate = 3600;

const STATIC_PAGES = ["/", "/get-started", "/states", "/bundles", "/shop", "/course", "/about", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  // One landing page per live bundle: /go/<state code>-<program>
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("products")
      .select("code, program, updated_at")
      .eq("type", "bundle")
      .eq("is_active", true)
      .like("product_slug", "%complete-bundle");
    const seen = new Set<string>();
    for (const row of data || []) {
      const slug = goSlug(row.code, row.program);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      pages.push({
        url: `${SITE_URL}/go/${slug}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch (err) {
    console.error("sitemap: could not load bundles", err);
  }
  return pages;
}

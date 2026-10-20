import { normalizeBundleFileLabel } from "@/lib/bundles";

// What's actually in storage for a bundle decides what can be sold:
// a single resource only if its file exists, the full bundle only if all four do.

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";

export const BUNDLE_RESOURCES = [
  "Market Research Report",
  "Pro Forma P&L Template",
  "Policy & Procedure Manual",
  "Licensing Checklist",
] as const;

export type BundleAsset = { label: string; name: string; type: string; size: number; path: string };

/** One entry per resource found in storage (the PDF manual stands in for its editable .docx twin). */
export async function listBundleAssets(supabase: any, bundleSlug: string): Promise<BundleAsset[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(bundleSlug, { limit: 100, sortBy: { column: "name", order: "asc" } });
    if (error || !data) return [];
    const byLabel = new Map<string, BundleAsset>();
    for (const f of data) {
      if (!f?.name || f.name.startsWith(".") || !f.id) continue;
      const label = normalizeBundleFileLabel(f.name);
      if (!(BUNDLE_RESOURCES as readonly string[]).includes(label)) continue;
      const existing = byLabel.get(label);
      if (existing && !/\.docx$/i.test(existing.name)) continue; // keep the PDF over the .docx
      byLabel.set(label, {
        label,
        name: f.name,
        type: f.metadata?.mimetype || f.metadata?.contentType || "application/octet-stream",
        size: f.metadata?.size || 0,
        path: `${bundleSlug}/${f.name}`,
      });
    }
    return BUNDLE_RESOURCES.filter((l) => byLabel.has(l)).map((l) => byLabel.get(l)!);
  } catch {
    return [];
  }
}

export const isCompleteBundle = (assets: { label: string }[]) =>
  BUNDLE_RESOURCES.every((l) => assets.some((a) => a.label === l));

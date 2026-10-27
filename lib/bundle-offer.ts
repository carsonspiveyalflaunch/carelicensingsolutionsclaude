import { normalizeBundleFileLabel } from "./bundle-labels";
import { BUMP_PURCHASED_ITEM, MRR_PURCHASED_ITEM } from "./meta-funnel";

export const BUNDLE_RESOURCES = [
  "Market Research Report",
  "Pro Forma P&L Template",
  "Policy & Procedure Manual",
  "Licensing Checklist",
] as const;

export type BundleAsset = { label: string; name: string; type: string; size: number; path: string };

/** Map storage basenames to sellable labels. Names that are not the four bundle resources are ignored. */
export function bundleAssetsFromFileNames(bundleSlug: string, names: string[]): BundleAsset[] {
  const byLabel = new Map<string, BundleAsset>();
  for (const name of names) {
    const base = String(name || "").trim();
    if (!base || base.startsWith(".") || base.includes("/") || base.includes("\\")) continue;
    const label = normalizeBundleFileLabel(base);
    if (!(BUNDLE_RESOURCES as readonly string[]).includes(label)) continue;
    const existing = byLabel.get(label);
    if (existing && !/\.docx$/i.test(existing.name)) continue;
    byLabel.set(label, {
      label,
      name: base,
      type: "application/octet-stream",
      size: 0,
      path: `${bundleSlug}/${base}`,
    });
  }
  return BUNDLE_RESOURCES.filter((label) => byLabel.has(label)).map((label) => byLabel.get(label)!);
}

export function bundleOfferFlags(assets: { label: string }[]): { available: boolean; checklist: boolean } {
  return {
    available: assets.some((asset) => asset.label === MRR_PURCHASED_ITEM),
    checklist: assets.some((asset) => asset.label === BUMP_PURCHASED_ITEM),
  };
}

import manifest from "@/public/previews/manifest.json";

export type Preview = { src: string; label: string };

/** Real page images from a bundle's own files, shown on its /go sales page. */
export function previewsFor(productSlug: string): Preview[] {
  const list = (manifest as Record<string, { file: string; label: string }[]>)[productSlug] || [];
  return list.map((p) => ({ src: `/previews/${productSlug}/${p.file}`, label: p.label }));
}

/** Complete-bundle slug from a full state name and program label, e.g. "Maryland" + "Residential Care (DD)". */
export function bundleSlugFor(stateName: string, program: string): string {
  const slug = (s: string) => s.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug(stateName)}-${slug(program)}-complete-bundle`;
}

const ASSET_PREVIEW_FILE: Record<string, string> = {
  "market research report": "report-page.webp",
  "pro forma p&l template": "pnl.webp",
  "pro forma p&l": "pnl.webp",
  "licensing checklist": "checklist.webp",
  "policy & procedure manual": "manual-toc.webp",
};

/** One preview image for a single asset card (e.g. "Licensing Checklist"), if we have it. */
export function assetPreview(productSlug: string, assetLabel: string): Preview | null {
  const file = ASSET_PREVIEW_FILE[assetLabel.trim().toLowerCase()];
  if (!file) return null;
  return previewsFor(productSlug).find((p) => p.src.endsWith(`/${file}`)) || null;
}

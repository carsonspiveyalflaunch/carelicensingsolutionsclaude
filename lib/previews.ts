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

/** The six page images the /go lightbox shows. A kit without the manual pages is not used as the sample. */
const CORE_PREVIEW_FILES = ["manual-toc.webp", "manual-page.webp", "checklist.webp", "pnl.webp", "report.webp", "report-page.webp"];

/** Full published kits used when the buyer's state has no complete preview set (Arizona, Texas, Virginia, …). */
export const PUBLISHED_SAMPLE_SLUGS: Record<string, string> = {
  "Assisted Living Facilities": "illinois-assisted-living-facilities-complete-bundle",
  "Personal Home Care": "illinois-personal-home-care-complete-bundle",
  "Residential Care (DD)": "illinois-residential-care-dd-complete-bundle",
};

function hasLaunchKitPages(list: Preview[]): boolean {
  return CORE_PREVIEW_FILES.every((file) => list.some((preview) => preview.src.endsWith(`/${file}`)));
}

/**
 * Page images for the post-pay upsell. Prefer the buyer's own bundle. Otherwise use the
 * Illinois kit for the same program, which has the full six-page lightbox.
 */
export function previewBundleFor(stateName?: string, program?: string): {
  productSlug: string;
  stateName?: string;
  usingPublishedSample: boolean;
  sampleTitle: string;
} {
  const ownSlug = stateName && program ? bundleSlugFor(stateName, program) : "";
  if (ownSlug && hasLaunchKitPages(previewsFor(ownSlug))) {
    return {
      productSlug: ownSlug,
      stateName,
      usingPublishedSample: false,
      sampleTitle: [stateName, program].filter(Boolean).join(" "),
    };
  }
  const known = program ? PUBLISHED_SAMPLE_SLUGS[program] : undefined;
  const productSlug = known || PUBLISHED_SAMPLE_SLUGS["Assisted Living Facilities"];
  const sampleProgram = known && program ? program : "Assisted Living Facilities";
  return {
    productSlug,
    usingPublishedSample: true,
    sampleTitle: `Illinois ${sampleProgram}`,
  };
}

import manifest from "@/public/previews/manifest.json";

export type Preview = { src: string; label: string };

/** Real page images from a bundle's own files, shown on its /go sales page. */
export function previewsFor(productSlug: string): Preview[] {
  const list = (manifest as Record<string, { file: string; label: string }[]>)[productSlug] || [];
  return list.map((p) => ({ src: `/previews/${productSlug}/${p.file}`, label: p.label }));
}

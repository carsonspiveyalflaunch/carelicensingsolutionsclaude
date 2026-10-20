import fs from "fs";
import path from "path";

// Licensing guides imported from the original carelicensingsolutions.com/blogs WordPress site.
// One JSON file per guide in content/guides, plus _index.json (everything except the body).

export type GuideSummary = {
  slug: string;
  title: string;
  state: string | null;
  program: string | null;
  /** /go/<slug> bundle landing page for the same state + program, if one exists. */
  bundle: string | null;
  date: string;
  modified: string;
  excerpt: string;
  words: number;
};
export type Guide = GuideSummary & { html: string };

const DIR = path.join(process.cwd(), "content", "guides");

/** Guides shorter than this are kept for readers but hidden from search until expanded. */
export const THIN_GUIDE_WORDS = 500;

let cache: GuideSummary[] | null = null;
export function allGuides(): GuideSummary[] {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(path.join(DIR, "_index.json"), "utf8")) as GuideSummary[];
    cache.sort((a, b) => (a.state || "").localeCompare(b.state || "") || a.title.localeCompare(b.title));
  }
  return cache;
}

export function getGuide(slug: string): Guide | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), "utf8")) as Guide;
  } catch {
    return null;
  }
}

export function guidesForBundle(goSlug: string): GuideSummary[] {
  return allGuides().filter((g) => g.bundle === goSlug);
}

export const isThin = (g: GuideSummary) => g.words < THIN_GUIDE_WORDS;

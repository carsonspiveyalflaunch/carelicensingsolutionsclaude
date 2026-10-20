import type { Metadata } from "next";

/** Public site address. Set NEXT_PUBLIC_SITE_URL in Vercel when the domain changes. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://carelicensingsolution.com").replace(/\/$/, "");
export const SITE_NAME = "Care Licensing Solutions";

/** Title, description, canonical and social tags for one public page. */
export function pageMeta(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Pages that should never appear in search (checkout, account, thank-you). */
export const PRIVATE_PAGE: Metadata = { robots: { index: false, follow: false } };

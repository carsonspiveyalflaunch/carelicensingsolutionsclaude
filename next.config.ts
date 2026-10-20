import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Old WordPress addresses (carelicensingsolutions.com/blogs/<slug>/) -> new /guides/<slug> pages,
// so links and rankings carry over once the original domain points here.
function guideRedirects() {
  try {
    const index = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/guides/_index.json"), "utf8"));
    return index
      .filter((g: { slug: string; old_slug?: string }) => g.old_slug)
      .map((g: { slug: string; old_slug: string }) => ({
        source: `/blogs/${g.old_slug}`,
        destination: `/guides/${g.slug}`,
        permanent: true,
      }));
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...guideRedirects(),
      { source: "/blogs", destination: "/guides", permanent: true },
      { source: "/blogs/category/:state", destination: "/guides#:state", permanent: true },
    ];
  },
  images: {
    unoptimized: true,
  },
  // Ship the verified bundle files with the admin publish route (see content-factory/).
  outputFileTracingIncludes: {
    "/api/admin/bundles/publish-verified": ["./content-factory/output/**/*"],
    // Imported licensing guides are read from disk by these routes.
    "/guides": ["./content/guides/**/*"],
    "/guides/[slug]": ["./content/guides/**/*"],
    "/go/[slug]": ["./content/guides/_index.json"],
    "/sitemap.xml": ["./content/guides/_index.json"],
  },
};

export default nextConfig;

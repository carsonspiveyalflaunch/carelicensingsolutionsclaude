import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/dashboard", "/checkout", "/cart", "/access", "/course/checkout", "/course/success"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

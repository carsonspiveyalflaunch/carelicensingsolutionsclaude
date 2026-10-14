import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Ship the verified bundle files with the admin publish route (see content-factory/).
  outputFileTracingIncludes: {
    "/api/admin/bundles/publish-verified": ["./content-factory/output/**/*"],
  },
};

export default nextConfig;

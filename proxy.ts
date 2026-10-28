import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cleanFunnelSearch, isFunnelProxyPath } from "@/lib/program-codes";

/**
 * Old ads and emails still use `?type=Hospice+Programs`. Redirect those GET
 * requests to `?p=<code>` before the page (and the pixel) load.
 * The matcher is a literal on purpose: Next.js ignores a matcher imported from another file.
 * Keep it in sync with FUNNEL_PROXY_PATHS plus `/market-research/:path*`.
 */
export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  if (!isFunnelProxyPath(request.nextUrl.pathname)) return NextResponse.next();
  const cleaned = cleanFunnelSearch(request.nextUrl.search);
  if (cleaned == null) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.search = cleaned;
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: [
    "/market-research",
    "/market-research/checkout",
    "/market-research/upsell",
    "/market-research/thank-you",
    "/market-research/:path*",
    "/launch-kit",
    "/offers/mrr",
  ],
};

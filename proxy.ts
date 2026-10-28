import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cleanFunnelSearch } from "@/lib/program-codes";

/**
 * Old ads and emails still use `?type=Hospice+Programs`. Redirect those GET
 * requests to `?p=<code>` before the page (and the pixel) load.
 */
export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  const cleaned = cleanFunnelSearch(request.nextUrl.search);
  if (cleaned == null) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.search = cleaned;
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/market-research", "/market-research/checkout", "/launch-kit", "/offers/mrr"],
};

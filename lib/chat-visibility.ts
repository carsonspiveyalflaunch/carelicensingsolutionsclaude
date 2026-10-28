/**
 * Where the $997 bundle assistant is allowed to render and answer.
 * The $47 market-research path sells a download and a $647 kit, so the
 * assistant (and its LAUNCH20 close) stays off that whole path.
 */

const SITE_HIDDEN_PREFIXES = ["/admin", "/dashboard", "/checkout"] as const;

/** Funnel routes. Top-level /upsell and /thank-you are included if those pages exist. */
const FUNNEL_PREFIXES = ["/market-research", "/offers", "/upsell", "/thank-you"] as const;

function normalizePath(pathname: string | null | undefined): string {
  const raw = (pathname || "").trim();
  if (!raw) return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  const path = withSlash.split(/[?#]/)[0] || "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isMetaFunnelPath(pathname: string | null | undefined): boolean {
  const path = normalizePath(pathname);
  return FUNNEL_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

/** True when the chat bubble must not render. */
export function hideChatBubble(pathname: string | null | undefined): boolean {
  const path = normalizePath(pathname);
  if (SITE_HIDDEN_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) return true;
  return isMetaFunnelPath(path);
}

/**
 * Refusal returned by /api/chat on the funnel. This is the only assistant
 * text those pages can get, and it does not mention the bundle price or LAUNCH20.
 */
export function funnelChatRefusal(pathname: string | null | undefined): { error: string } | null {
  if (!isMetaFunnelPath(pathname)) return null;
  return { error: "Chat is unavailable on this page." };
}

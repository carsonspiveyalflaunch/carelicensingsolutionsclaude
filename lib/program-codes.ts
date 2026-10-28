/**
 * Opaque program codes for funnel URLs.
 *
 * Meta's pixel sends the full page URL. Query values like
 * `type=Residential+Care+(DD)` and `type=Hospice+Programs` are health-category
 * signals. New links use `p=<code>` (for example `?state=AZ&p=rcdd`).
 * Display names stay in the catalog, the page copy, and Stripe metadata.
 *
 * Old `type=` and `program=` links still resolve. `cleanFunnelSearch` rewrites
 * them to `p=` when the name is known.
 */

const PROGRAM_ROWS = [
  ["alf", "Assisted Living Facilities"],
  ["phc", "Personal Home Care"],
  ["rcdd", "Residential Care (DD)"],
  ["hha", "Home Health Agencies"],
  ["nfs", "Nursing Facilities (SNF)"],
  ["adc", "Adult Day Care Programs"],
  ["hsp", "Hospice Programs"],
  ["ccf", "Child Care Facilities"],
  ["ghc", "Group Homes for Children"],
  ["rtc", "Residential Treatment (Children)"],
  ["asc", "Ambulatory Surgical Centers"],
  ["icf", "Intermediate Care Facilities"],
] as const;

export type ProgramCode = (typeof PROGRAM_ROWS)[number][0];

const NAME_BY_CODE = new Map<string, string>(PROGRAM_ROWS.map(([code, name]) => [code, name]));
const CODE_BY_NAME = new Map<string, string>(PROGRAM_ROWS.map(([code, name]) => [normalizeProgramName(name), code]));

export function knownFunnelPrograms(): ReadonlyArray<{ code: string; name: string }> {
  return PROGRAM_ROWS.map(([code, name]) => ({ code, name }));
}

function normalizeProgramName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Code for a display name or an existing code. Null when the program is not mapped. */
export function programCodeForName(value: string | null | undefined): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  const asCode = raw.toLowerCase();
  if (NAME_BY_CODE.has(asCode)) return asCode;
  return CODE_BY_NAME.get(normalizeProgramName(raw)) ?? null;
}

export function programNameFromCode(value: string | null | undefined): string | null {
  const code = (value || "").trim().toLowerCase();
  return NAME_BY_CODE.get(code) ?? null;
}

/** Canonical display name for a code or a known program name. */
export function canonicalProgramName(value: string | null | undefined): string | null {
  const code = programCodeForName(value);
  return code ? NAME_BY_CODE.get(code) ?? null : null;
}

/** First usable program value, mapped to the catalog name when it is a known code or name. */
export function resolveProgramInput(...values: unknown[]): string {
  const raw = values.find((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (!raw) return "";
  return canonicalProgramName(raw) || raw.trim().replace(/\s+/g, " ");
}

type QueryLike = { get(name: string): string | null };

/**
 * Program display name from a funnel query.
 * `p` wins. Otherwise `type` or `program` (the legacy param) is accepted.
 * Unknown text is returned trimmed so an exact catalog match can still work.
 */
export function programQueryValue(params: QueryLike): string {
  const fromCode = programNameFromCode(params.get("p"));
  if (fromCode) return fromCode;
  const raw = params.get("type") || params.get("program") || "";
  return canonicalProgramName(raw) || raw.trim().replace(/\s+/g, " ");
}

/** Query string for a funnel page. Drops `type` and `program` display names. */
export function funnelQuery(
  currentSearch: string,
  selection: { state?: string; program?: string },
): string {
  const params = new URLSearchParams(currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch);
  const state = (selection.state || "").trim();
  const program = selection.program || "";
  if (state) params.set("state", state.toUpperCase());
  else params.delete("state");
  params.delete("type");
  params.delete("program");
  const opaque = programCodeForName(program);
  if (opaque) params.set("p", opaque);
  else params.delete("p");
  if (program.trim() && !opaque) {
    console.warn(`Funnel URL omitted unmapped program "${program.trim()}". Add it to lib/program-codes.ts.`);
  }
  return params.toString();
}

export function funnelHref(pathname: string, state: string, program: string, currentSearch = ""): string {
  const qs = funnelQuery(currentSearch, { state, program });
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Offer lookup query. Known programs use `p` so the request URL has no display name. */
export function funnelOfferQuery(state: string, program: string): string {
  const params = new URLSearchParams();
  if (state) params.set("state", state.toUpperCase());
  const opaque = programCodeForName(program);
  if (opaque) params.set("p", opaque);
  else if (program.trim()) params.set("type", program.trim().replace(/\s+/g, " "));
  return params.toString();
}

/**
 * Search string with legacy program params rewritten to `p`, or null when the
 * URL should be left alone (already clean, or the name is not in the map).
 */
export function cleanFunnelSearch(search: string): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  if (!params.has("type") && !params.has("program")) return null;
  const resolved =
    canonicalProgramName(params.get("p")) ||
    canonicalProgramName(params.get("type")) ||
    canonicalProgramName(params.get("program"));
  if (!resolved) return null;
  const code = programCodeForName(resolved);
  if (!code) return null;
  params.delete("type");
  params.delete("program");
  params.set("p", code);
  return params.toString();
}

/** Rewrite a same-site funnel URL that still carries `type=` or `program=`. */
export function withCleanFunnelSearch(url: string): string {
  try {
    const parsed = new URL(url);
    const cleaned = cleanFunnelSearch(parsed.search);
    if (cleaned == null) return url;
    parsed.search = cleaned;
    return parsed.toString();
  } catch {
    return url;
  }
}

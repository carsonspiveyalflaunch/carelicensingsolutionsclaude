import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

/** Ad shorthand. The canonical funnel page is /market-research. */
export default async function MarketResearchOfferAlias({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
  }
  const qs = query.toString();
  redirect(qs ? `/market-research?${qs}` : "/market-research");
}

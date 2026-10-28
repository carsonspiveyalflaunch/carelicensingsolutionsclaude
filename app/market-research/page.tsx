import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import MarketResearchView from "./MarketResearchView";
import { loadCompleteBundles } from "@/lib/complete-bundles";
import { filterFunnelReportChoices } from "@/lib/funnel-catalog";
import { pageMeta } from "@/lib/seo";

const display = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export const dynamic = "force-dynamic";

const marketResearchMeta = pageMeta(
  "/market-research",
  "License-First Market Map — $47 | Care Licensing Solutions",
  "For care-business founders and entrepreneurs in any state. The state and program market research report: rates, licensing path, and startup snapshot. $47, instant PDF.",
);

export const metadata: Metadata = {
  ...marketResearchMeta,
  robots: { index: false, follow: false },
  openGraph: {
    ...marketResearchMeta.openGraph,
    images: [
      {
        url: "/market-research/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Care Licensing Solutions — License-First Market Map, $47",
      },
    ],
  },
  twitter: {
    ...marketResearchMeta.twitter,
    images: ["/market-research/opengraph-image.png"],
  },
};

export default async function MarketResearchPage() {
  let choices: { code: string; state: string; program: string }[] = [];
  try {
    const bundles = await loadCompleteBundles();
    choices = await filterFunnelReportChoices(bundles.map(({ code, state, program }) => ({ code, state, program })));
  } catch (err) {
    console.error("Market research catalog failed:", err);
  }

  return (
    <div className={`${display.className} bg-black text-white`}>
      <Suspense fallback={<div className="px-4 py-32 text-center text-white/70">Loading the report…</div>}>
        <MarketResearchView choices={choices} />
      </Suspense>
    </div>
  );
}

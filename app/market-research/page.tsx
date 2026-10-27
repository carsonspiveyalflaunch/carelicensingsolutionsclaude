import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import MarketResearchView from "./MarketResearchView";
import { loadCompleteBundles } from "@/lib/complete-bundles";
import { pageMeta } from "@/lib/seo";

const display = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMeta(
    "/market-research",
    "License-First Market Map — $47 | Care Licensing Solutions",
    "For nurses and healthcare professionals in any state. The state and program market research report: rates, licensing path, and startup snapshot. $47, instant PDF.",
  ),
  robots: { index: false, follow: false },
};

export default async function MarketResearchPage() {
  let choices: { code: string; state: string; program: string }[] = [];
  try {
    const bundles = await loadCompleteBundles();
    choices = bundles.map(({ code, state, program }) => ({ code, state, program }));
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

import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MarketResearchView from "./MarketResearchView";
import { loadCompleteBundles } from "@/lib/complete-bundles";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMeta(
    "/market-research",
    "License-First Market Map — $47 | Care Licensing Solutions",
    "For nurses and healthcare professionals. The state and program market research report: rates, licensing path, and startup snapshot. $47, instant PDF.",
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
    <>
      <Header />
      <Suspense fallback={<div className="bg-white px-4 py-32 text-center text-slate-600">Loading the report…</div>}>
        <MarketResearchView choices={choices} />
      </Suspense>
      <Footer />
    </>
  );
}

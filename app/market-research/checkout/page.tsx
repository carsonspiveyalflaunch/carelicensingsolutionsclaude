import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CheckoutView from "./CheckoutView";
import { loadCompleteBundles } from "@/lib/complete-bundles";
import { filterFunnelReportChoices } from "@/lib/funnel-catalog";
import { PRIVATE_PAGE } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { ...PRIVATE_PAGE, title: "Checkout | Care Licensing Solutions" };

export default async function MarketResearchCheckoutPage() {
  let choices: { code: string; state: string; program: string }[] = [];
  try {
    const bundles = await loadCompleteBundles();
    choices = await filterFunnelReportChoices(bundles.map(({ code, state, program }) => ({ code, state, program })));
  } catch (err) {
    console.error("Market research checkout catalog failed:", err);
  }

  return (
    <>
      <Header />
      <Suspense fallback={<div className="bg-slate-50 px-4 py-32 text-center text-slate-600">Loading checkout…</div>}>
        <CheckoutView choices={choices} />
      </Suspense>
      <Footer />
    </>
  );
}

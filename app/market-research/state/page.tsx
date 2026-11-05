import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import StatePackCheckout from "./StatePackCheckout";
import { loadCompleteBundles } from "@/lib/complete-bundles";
import { PRIVATE_PAGE } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { ...PRIVATE_PAGE, title: "Checkout | Care Licensing Solutions" };

export default async function StatePackCheckoutPage() {
  let choices: { code: string; state: string; program: string }[] = [];
  try {
    const bundles = await loadCompleteBundles();
    choices = bundles.map(({ code, state, program }) => ({ code, state, program }));
  } catch (err) {
    console.error("State pack checkout catalog failed:", err);
  }

  return (
    <>
      <Header />
      <Suspense fallback={<div className="bg-slate-50 px-4 py-32 text-center text-slate-600">Loading checkout…</div>}>
        <StatePackCheckout choices={choices} />
      </Suspense>
      <Footer />
    </>
  );
}

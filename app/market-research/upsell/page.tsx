import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import UpsellView from "./UpsellView";
import { PRIVATE_PAGE } from "@/lib/seo";

export const metadata: Metadata = { ...PRIVATE_PAGE, title: "Add the Launch Kit | Care Licensing Solutions" };

export default function UpsellPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="bg-white px-4 py-32 text-center text-slate-600">Loading your order…</div>}>
        <UpsellView />
      </Suspense>
      <Footer />
    </>
  );
}

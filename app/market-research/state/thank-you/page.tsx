import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import StatePackThankYou from "./StatePackThankYou";
import { PRIVATE_PAGE } from "@/lib/seo";

export const metadata: Metadata = { ...PRIVATE_PAGE, title: "Your program packs are ready | Care Licensing Solutions" };

export default function StatePackThankYouPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="bg-slate-50 px-4 py-32 text-center text-slate-600">Loading your packs…</div>}>
        <StatePackThankYou />
      </Suspense>
      <Footer />
    </>
  );
}

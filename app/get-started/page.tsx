import Footer from "../components/Footer";
import GetStartedSteps from "../components/GetStartedSteps";
import Header from "../components/Header";
import { Suspense } from "react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta('/get-started', 'Find Your State Licensing Bundle | Care Licensing Solutions', 'Choose your state and program type to get the licensing checklist, policy manual, market research and pro forma P&L you need to open your care business.');

export default function GetStartedPage() {
  // All step logic is now handled in the client component for hydration and navigation correctness
  return (
    <>
      <Header />
      <div className="bg-white min-h-screen pt-24">
        <Suspense fallback={<div className="text-center py-16">Loading...</div>}>
          <GetStartedSteps />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}

import Footer from "../components/Footer";
import GetStartedSteps from "../components/GetStartedSteps";
import Header from "../components/Header";
import { Suspense } from "react";

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

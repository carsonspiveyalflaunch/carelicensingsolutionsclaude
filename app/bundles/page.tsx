import Header from "../components/Header";
import Footer from "../components/Footer";
import BundlesPageMainSection from "./components/BundlesPageMainSection";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta('/bundles', 'Complete State Licensing Bundles | Care Licensing Solutions', 'Get the complete licensing bundle for your state and program: market research report, pro forma P&L, licensing checklist and state-specific policy and procedure manual.');

export default function BundlesPage() {
  return (
    <>
      <Header />
      <BundlesPageMainSection />
      <Footer />
    </>
  );
}
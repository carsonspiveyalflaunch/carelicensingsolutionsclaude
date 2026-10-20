import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import ProgramTypes from "./components/ProgramTypes";
import Header from "./components/Header";
import ReviewBar from "./components/ReviewBar";
import BundleFeatures from "./components/BundleFeatures";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta('/', 'How to Open a Licensed Care Business in Any State | Care Licensing Solutions', 'State-specific licensing bundles for assisted living, home care, group homes, home health, hospice and more: market research, pro forma P&L, licensing checklist and policy manual. Instant download.');

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <ReviewBar />
      <HowItWorks />
      <ProgramTypes />
      <BundleFeatures />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}

import Header from "../components/Header";
import Footer from "../components/Footer";
import AboutPageHero from "./components/AboutPageHero";
import AboutPageStatsSection from "./components/AboutPageStatsSection";
import AboutPageMissionSection from "./components/AboutPageMissionSection";
import AboutPageStorySection from "./components/AboutPageStorySection";
import BundleFeatures from "../components/BundleFeatures";
import CTA from "../components/CTA";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta('/about', 'About Care Licensing Solutions', 'Care Licensing Solutions builds state-specific licensing and startup resources for people opening assisted living facilities, home care agencies, group homes and other care businesses.');

export default function AboutPage() {
  return (
    <>
      <Header />
      <AboutPageHero />
      <AboutPageStatsSection />
      <AboutPageMissionSection />
      <AboutPageStorySection />
      <BundleFeatures />
      <CTA />
      <Footer />
    </>
  );
}

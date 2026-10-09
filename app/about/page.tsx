import Header from "../components/Header";
import Footer from "../components/Footer";
import AboutPageHero from "./components/AboutPageHero";
import AboutPageStatsSection from "./components/AboutPageStatsSection";
import AboutPageMissionSection from "./components/AboutPageMissionSection";
import AboutPageStorySection from "./components/AboutPageStorySection";
import BundleFeatures from "../components/BundleFeatures";
import CTA from "../components/CTA";

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

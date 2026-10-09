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

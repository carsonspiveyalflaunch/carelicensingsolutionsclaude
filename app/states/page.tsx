import Header from "../components/Header";
import Footer from "../components/Footer";
import StatesBanner from "../components/StatesBanner";
import StatesMapSection from "../components/StatesMapSection";
import StatesPageCTA from "../components/StatesPageCTA";
import StatesDirectory from "./StatesDirectory";
import { pageMeta } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMeta('/states', 'Care Facility Licensing Requirements by State | Care Licensing Solutions', 'Pick your state to see licensing resources for assisted living, home care, group homes, home health, hospice, adult day care, child care and more.');

export default function States() {
  return (
    <>
      <Header />
      <StatesBanner />
      <StatesMapSection />
      <StatesDirectory />
      <StatesPageCTA />
      <Footer />
    </>
  );
}

import Header from "../components/Header";
import Footer from "../components/Footer";
import StatesBanner from "../components/StatesBanner";
import StatesMapSection from "../components/StatesMapSection";
import StatesPageCTA from "../components/StatesPageCTA";

export default function States() {
  return (
    <>
      <Header />
      <StatesBanner />
      <StatesMapSection />
      <StatesPageCTA />
      <Footer />
    </>
  );
}

import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactPageBanner from "../components/ContactPageBanner";
import ContactPageMain from "../components/ContactPageMain";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta('/contact', 'Contact Care Licensing Solutions', 'Questions about a licensing bundle or your downloads? Contact Care Licensing Solutions.');

export default function Contact() {
  return (
    <>
      <Header />
      <ContactPageBanner />
      <ContactPageMain />
      <Footer />
    </>
  );
}

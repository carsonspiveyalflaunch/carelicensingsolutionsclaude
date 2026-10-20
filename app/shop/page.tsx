import Header from "../components/Header";
import ShopMain from "../components/ShopMain";
import ShopPageBanner from "../components/ShopPageBanner";
import Footer from "../components/Footer";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta('/shop', 'Shop Care Licensing Bundles & Resources | Care Licensing Solutions', 'Browse licensing bundles and individual resources for every state and program type: policy and procedure manuals, licensing checklists, market research and pro forma P&L templates.');

export default function Shop() {
  return (
    <>
      <Header />
      <ShopPageBanner />
      <ShopMain />
      <Footer />
    </>
  );
}

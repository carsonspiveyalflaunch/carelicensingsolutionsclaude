import CheckoutClient from "../components/CheckoutClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PRIVATE_PAGE } from "@/lib/seo";

export const metadata = PRIVATE_PAGE;

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CheckoutClient />
      <Footer />
    </>
  );
}

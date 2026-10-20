import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AccessForm from "./AccessForm";

export const metadata: Metadata = {
  title: "Get your downloads | Care Licensing Solutions",
  description: "Bought a bundle? Enter your email and we'll send a one-click login link to your downloads.",
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">Get your downloads</h1>
          <p className="mt-2 text-slate-600">
            Enter the email you used at checkout. We&apos;ll send a link that logs you straight into your
            downloads, no password needed.
          </p>
          <AccessForm />
        </div>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import './globals.css';
import AppProviders from "./components/AppProviders";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Care Licensing Solutions", template: "%s" },
  description:
    "State-specific licensing bundles for care businesses: market research, pro forma P&L, licensing checklist and policy & procedure manual. Instant download.",
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_US" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  sameAs: ["https://www.skool.com/carelicensingsolutions"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        {/* Google Ads tag (Care Licensing Solutions account) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18531893917"
          strategy="afterInteractive"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18531893917');`}
        </Script>
        <AppProviders>
          <main>{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}

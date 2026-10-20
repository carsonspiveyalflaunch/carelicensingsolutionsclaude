import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, FileSpreadsheet, FileText, ShieldCheck, Download, Clock } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BuyButton from "./BuyButton";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { PROGRAM_HEADLINE, parseGoSlug } from "@/lib/go-links";
import { pageMeta, SITE_URL, SITE_NAME } from "@/lib/seo";

export const revalidate = 300;

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";

// Codes the checkout accepts (see getDiscountPercent in create-checkout-session).
const CODE_PERCENT: Record<string, number> = { LAUNCH20: 20, SAVE15: 15, SAVE10: 10, WELCOME5: 5 };

type Bundle = { product_slug: string; name: string; price: number; state: string; code: string; program: string };

async function loadBundle(slug: string): Promise<{ bundle: Bundle; files: string[] } | null> {
  const parsed = parseGoSlug(slug);
  if (!parsed) return null;
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("product_slug, name, price, state, code, program")
    .eq("type", "bundle")
    .eq("is_active", true)
    .eq("code", parsed.code)
    .eq("program", parsed.program)
    .like("product_slug", "%complete-bundle")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { data: listed } = await supabase.storage.from(BUCKET).list(data.product_slug, { limit: 100 });
  const files = (listed || []).filter((f) => f.id && f.name).map((f) => f.name);
  return { bundle: { ...data, price: Number(data.price) }, files };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadBundle(slug);
  if (!loaded) return { title: "Bundle not found | Care Licensing Solutions" };
  const { state, program } = loaded.bundle;
  const what = PROGRAM_HEADLINE[program] || program;
  return pageMeta(
    `/go/${slug}`,
    `How to Open ${what} in ${state} | Licensing Bundle`,
    `Everything you need to license and launch ${what} in ${state}: market research, pro forma P&L, licensing checklist and policy manual. Instant download.`,
  );
}

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export default async function GoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { slug } = await params;
  const { code } = await searchParams;
  const loaded = await loadBundle(slug);
  if (!loaded) notFound();
  const { bundle, files } = loaded;
  const { state, program, price } = bundle;
  const what = PROGRAM_HEADLINE[program] || program;

  const discountCode = code && CODE_PERCENT[code.toUpperCase()] ? code.toUpperCase() : undefined;
  const pct = discountCode ? CODE_PERCENT[discountCode] : 0;
  const finalPrice = Math.round(price * (100 - pct)) / 100;

  const has = (prefix: string) => files.some((f) => f.startsWith(prefix));
  const items = [
    has("market-research-report") && {
      icon: FileText,
      title: `${state} Market Research Report`,
      body: `Demand, competition, reimbursement rates and where to open in ${state}, so you pick the right market before you spend a dollar.`,
    },
    has("pro-forma-pl-template") && {
      icon: FileSpreadsheet,
      title: "Pro Forma P&L (Excel)",
      body: "Startup costs, staffing, revenue and break-even, pre-built with state rates. Change the numbers and see your profit instantly.",
    },
    has("licensing-checklist") && {
      icon: CheckCircle2,
      title: `${state} Licensing Checklist`,
      body: "Every form, fee, inspection and agency step in order, so your application isn't sent back for something you missed.",
    },
    has("policy-procedure-manual") && {
      icon: FileText,
      title: "Policy & Procedure Manual (PDF + editable Word)",
      body: `Written for ${state} requirements. Add your agency name and you have the manual surveyors ask to see.`,
    },
  ].filter(Boolean) as { icon: typeof FileText; title: string; body: string }[];

  const cta = pct ? `Get the ${state} Bundle for ${money(finalPrice)}` : `Get the ${state} Bundle — ${money(price)}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${state} ${program} Licensing Bundle`,
      description: `Market research report, pro forma P&L, licensing checklist and policy & procedure manual for opening ${what} in ${state}.`,
      brand: { "@type": "Brand", name: SITE_NAME },
      url: `${SITE_URL}/go/${slug}`,
      offers: {
        "@type": "Offer",
        price: price.toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/go/${slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "States", item: `${SITE_URL}/states` },
        { "@type": "ListItem", position: 3, name: `${state} ${program}`, item: `${SITE_URL}/go/${slug}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="bg-white">
        <section className="bg-gradient-to-br from-emerald-950 to-slate-950 px-4 py-14 text-white sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
              {state} · {program}
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
              Open {what} in {state}
            </h1>
            <p className="mt-5 text-lg text-slate-200">
              The complete licensing and launch package: research, financials, checklist and policies, built for{" "}
              {state} and ready to download today.
            </p>
            <div className="mx-auto mt-8 max-w-md">
              {pct > 0 && (
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-4 py-1.5 text-sm font-semibold text-amber-300">
                  <Clock className="h-4 w-4" /> Launch price: {pct}% off applied at checkout
                </p>
              )}
              <BuyButton
                productSlug={bundle.product_slug}
                name={bundle.name}
                price={price}
                discountCode={discountCode}
                cancelPath={`/go/${slug}${discountCode ? `?code=${discountCode}` : ""}`}
                label={cta}
              />
              <p className="mt-3 text-sm text-slate-300">
                {pct > 0 && <span className="mr-2 line-through">{money(price)}</span>}
                One-time payment · Instant download · Secure checkout by Stripe
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-950">What&apos;s inside</h2>
            <div className="mt-6 grid gap-4">
              {items.map((it) => (
                <div key={it.title} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                  <it.icon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                  <div>
                    <h3 className="font-semibold text-slate-950">{it.title}</h3>
                    <p className="mt-1 text-slate-600">{it.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Download, t: "Instant access", d: "Download everything right after checkout." },
                { icon: ShieldCheck, t: "Built for " + state, d: "State-specific rules, rates and agencies." },
                { icon: CheckCircle2, t: "Yours to keep", d: "Edit, print and reuse for your agency." },
              ].map((b) => (
                <div key={b.t} className="rounded-xl bg-slate-50 p-5">
                  <b.icon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 font-semibold text-slate-900">{b.t}</p>
                  <p className="mt-1 text-sm text-slate-600">{b.d}</p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-12 max-w-md text-center">
              <BuyButton
                productSlug={bundle.product_slug}
                name={bundle.name}
                price={price}
                discountCode={discountCode}
                cancelPath={`/go/${slug}${discountCode ? `?code=${discountCode}` : ""}`}
                label={cta}
              />
              <p className="mt-3 text-sm text-slate-500">
                Questions?{" "}
                <a href="/contact" className="font-medium text-emerald-700 underline">
                  Contact us
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

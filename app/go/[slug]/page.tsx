import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, FileSpreadsheet, FileText, ShieldCheck, Download, Clock } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BuyButton from "./BuyButton";
import LeadCapture from "./LeadCapture";
import BundlePreviews from "../../components/BundlePreviews";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { PROGRAM_HEADLINE, parseGoSlug } from "@/lib/go-links";
import { pageMeta, SITE_URL, SITE_NAME } from "@/lib/seo";
import { guidesForBundle } from "@/lib/guides";
import { isCompleteBundle } from "@/lib/bundle-files";
import { normalizeBundleFileLabel } from "@/lib/bundles";
import Link from "next/link";
import { promoPercent, promoDeadline } from "@/lib/promos";
import { PAY_LATER_ENABLED, payIn4, walkthroughEmbedUrl } from "@/lib/pay-later";
import { previewsFor } from "@/lib/previews";
import { checkoutDisplayName } from "@/lib/checkout-name";
import { COURSE_PRICE_DOLLARS, COURSE_TITLE, COURSE_DETAIL, SINGLE_ASSET_SLUGS, COMMUNITY_EXTRAS } from "@/lib/value-stack";
import { Gift } from "lucide-react";

export const revalidate = 300;

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";


type Bundle = { product_slug: string; name: string; price: number; state: string; code: string; program: string };

async function loadAssetPrices(): Promise<Record<string, number>> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("product_slug, price")
    .in("product_slug", Object.values(SINGLE_ASSET_SLUGS));
  return Object.fromEntries((data || []).map((r: { product_slug: string; price: number | string }) => [r.product_slug, Number(r.price)]));
}

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
  const complete = isCompleteBundle(loaded.files.map((f) => ({ label: normalizeBundleFileLabel(f) })));
  const meta = pageMeta(
    `/go/${slug}`,
    `How to Open ${what} in ${state} | Licensing Bundle`,
    `Everything you need to license and launch ${what} in ${state}: market research, pro forma P&L, licensing checklist and policy manual. Instant download.`,
  );
  return complete ? meta : { ...meta, robots: { index: false, follow: true } };
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
  let loaded: Awaited<ReturnType<typeof loadBundle>> = null;
  try {
    loaded = await loadBundle(slug);
  } catch (e) {
    console.error("Bundle page load failed:", slug, e);
  }
  if (!loaded) {
    // A link (chat assistant, ad, old text) pointed at a state + program we don't sell:
    // send them to the bundle finder for that state instead of a dead 404.
    const parsed = parseGoSlug(slug) || (/^[a-z]{2}-/.test(slug) ? { code: slug.slice(0, 2).toUpperCase() } : null);
    if (parsed) redirect(`/get-started?state=${parsed.code}`);
    notFound();
  }
  const { bundle, files } = loaded;
  const { state, program, price } = bundle;
  const productName = checkoutDisplayName(
    { product_slug: bundle.product_slug, name: bundle.name },
    bundle,
  );
  const what = PROGRAM_HEADLINE[program] || program;
  const guides = guidesForBundle(slug);
  const complete = isCompleteBundle(files.map((f) => ({ label: normalizeBundleFileLabel(f) })));
  const resourcesHref = `/get-started?state=${bundle.code}&type=${encodeURIComponent(program)}`;

  const discountCode = code && promoPercent(code) ? code.toUpperCase() : undefined;
  const pct = discountCode ? promoPercent(discountCode) : 0;
  const deadline = promoDeadline(discountCode);
  const finalPrice = Math.round(price * (100 - pct)) / 100;
  const previews = previewsFor(bundle.product_slug);
  const assetPrices = await loadAssetPrices();
  const videoUrl = walkthroughEmbedUrl();

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

  const priceOf = (key: keyof typeof SINGLE_ASSET_SLUGS) => assetPrices[SINGLE_ASSET_SLUGS[key]] || 0;
  const assetValue: Record<string, number> = {
    [`${state} Market Research Report`]: priceOf("report"),
    "Pro Forma P&L (Excel)": priceOf("pnl"),
    [`${state} Licensing Checklist`]: priceOf("checklist"),
    "Policy & Procedure Manual (PDF + editable Word)": priceOf("manual"),
  };
  const stack = [
    ...items.map((it) => ({ title: it.title, detail: "", value: assetValue[it.title] || 0, bonus: false })),
    { title: COURSE_TITLE, detail: COURSE_DETAIL, value: COURSE_PRICE_DOLLARS, bonus: true },
    ...COMMUNITY_EXTRAS.map((x) => ({ title: x.title, detail: x.detail, value: 0, bonus: true })),
  ];
  const totalValue = stack.reduce((sum, x) => sum + x.value, 0);
  const youPay = pct ? finalPrice : price;

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
        availability: complete ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
                  <Clock className="h-4 w-4" /> Launch price: {pct}% off{deadline ? ` — ends ${deadline}` : " applied at checkout"}
                </p>
              )}
              {complete ? (
              <BuyButton
                productSlug={bundle.product_slug}
                name={productName}
                price={price}
                discountCode={discountCode}
                cancelPath={`/go/${slug}${discountCode ? `?code=${discountCode}` : ""}`}
                label={cta}
              />
              ) : (
                <div className="rounded-xl bg-amber-50 px-5 py-4 text-amber-900">
                  <p className="font-semibold">This bundle is being finalized.</p>
                  <p className="mt-1 text-sm">
                    Some of its resources are available individually now.{" "}
                    <a href={resourcesHref} className="font-semibold underline">See what&apos;s available</a>
                  </p>
                </div>
              )}
              <p className="mt-3 text-sm text-slate-300">
                {pct > 0 && <span className="mr-2 line-through">{money(price)}</span>}
                {PAY_LATER_ENABLED ? "Pay in full or over time" : "One-time payment"} · Instant download · Secure checkout by Stripe
              </p>
              {PAY_LATER_ENABLED && complete && (
                <p className="mt-2 text-sm text-emerald-200">
                  Or 4 interest-free payments of {payIn4(finalPrice)} with Afterpay.
                  <span className="block text-xs text-slate-400">Subject to approval at checkout.</span>
                </p>
              )}
            </div>
          </div>
        </section>

        {videoUrl && (
          <section className="bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-slate-950">See what you get (2 minutes)</h2>
              <div className="mt-5 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm">
                <iframe
                  src={videoUrl}
                  title="Walkthrough of the licensing bundle"
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        )}

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

            {previews.length > 0 && (
              <div className="mt-12">
                <BundlePreviews productSlug={bundle.product_slug} stateName={state} />
              </div>
            )}

            {complete && (
              <div className="mt-12 overflow-hidden rounded-2xl border-2 border-emerald-700">
                <div className="bg-emerald-700 px-5 py-4 text-white">
                  <h2 className="text-xl font-bold">Everything you get today</h2>
                  <p className="text-sm text-emerald-100">Your {state} bundle plus the full ALF Launch program, free with your purchase.</p>
                </div>
                <ul className="divide-y divide-slate-200">
                  {stack.map((x) => (
                    <li key={x.title} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="flex gap-3">
                        {x.bonus ? <Gift className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />}
                        <div>
                          <p className="font-semibold text-slate-900">
                            {x.bonus && <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold uppercase text-amber-800">Bonus</span>}
                            {x.title}
                          </p>
                          {x.detail && <p className="mt-1 text-sm text-slate-600">{x.detail}</p>}
                        </div>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold text-slate-700">
                        {x.value ? money(x.value) : "Included"}
                        {x.value ? <span className="block text-xs font-normal text-slate-500">sold separately</span> : null}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="bg-slate-50 px-5 py-5">
                  <div className="flex items-baseline justify-between text-slate-700">
                    <span>Total if bought separately</span>
                    <span className="font-semibold line-through">{money(totalValue)}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-slate-950">
                    <span className="text-lg font-bold">Your price today</span>
                    <span className="text-2xl font-bold text-emerald-800">{money(youPay)}</span>
                  </div>
                  {deadline && <p className="mt-1 text-right text-sm font-medium text-amber-700">Launch price ends {deadline}</p>}
                  <div className="mt-4">
                    <BuyButton
                      productSlug={bundle.product_slug}
                      name={productName}
                      price={price}
                      discountCode={discountCode}
                      cancelPath={`/go/${slug}${discountCode ? `?code=${discountCode}` : ""}`}
                      label={cta}
                    />
                  </div>
                </div>
              </div>
            )}

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
              {complete ? (
              <BuyButton
                productSlug={bundle.product_slug}
                name={productName}
                price={price}
                discountCode={discountCode}
                cancelPath={`/go/${slug}${discountCode ? `?code=${discountCode}` : ""}`}
                label={cta}
              />
              ) : (
                <div className="rounded-xl bg-amber-50 px-5 py-4 text-amber-900">
                  <p className="font-semibold">This bundle is being finalized.</p>
                  <p className="mt-1 text-sm">
                    Some of its resources are available individually now.{" "}
                    <a href={resourcesHref} className="font-semibold underline">See what&apos;s available</a>
                  </p>
                </div>
              )}
              <div className="mt-6">
                <LeadCapture
                  slug={slug}
                  state={state}
                  program={program}
                  guideHref={guides[0] ? `/guides/${guides[0].slug}` : undefined}
                />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Questions?{" "}
                <a href="/contact" className="font-medium text-emerald-700 underline">
                  Contact us
                </a>
              </p>
            </div>
          </div>
        </section>
        {guides.length ? (
          <section className="bg-white py-12">
            <div className="mx-auto max-w-3xl px-4">
              <h2 className="text-xl font-bold text-slate-900">Read the free {state} guide first</h2>
              <ul className="mt-3 space-y-2">
                {guides.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/guides/${g.slug}`} className="text-emerald-800 hover:underline">{g.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}

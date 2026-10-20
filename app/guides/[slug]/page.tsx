import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { allGuides, getGuide, isThin } from "@/lib/guides";
import { PROGRAM_HEADLINE, parseGoSlug } from "@/lib/go-links";
import { pageMeta, SITE_URL, SITE_NAME } from "@/lib/seo";
import { createServerSupabaseClient } from "@/utils/supabase-server";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return allGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return { title: "Guide not found | Care Licensing Solutions" };
  const meta = pageMeta(`/guides/${slug}`, g.title.length > 70 ? g.title : `${g.title} | ${SITE_NAME}`, g.excerpt.slice(0, 158));
  return isThin(g) ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/** Price of the live bundle for this guide, or null if it isn't sold. */
async function bundlePrice(goSlug: string | null): Promise<number | null> {
  const parsed = goSlug ? parseGoSlug(goSlug) : null;
  if (!parsed) return null;
  try {
    const { data } = await createServerSupabaseClient()
      .from("products")
      .select("price")
      .eq("type", "bundle")
      .eq("is_active", true)
      .eq("code", parsed.code)
      .eq("program", parsed.program)
      .like("product_slug", "%complete-bundle")
      .limit(1)
      .maybeSingle();
    return data ? Number(data.price) : null;
  } catch {
    return null;
  }
}

function BundleCta({ href, state, what, price }: { href: string; state: string; what: string; price: number }) {
  return (
    <aside className="my-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{state} Licensing Bundle</p>
      <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
        Everything you need to open {what} in {state}
      </h2>
      <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        {["State-specific policy & procedure manual", "Licensing checklist", "Market research report", "Pro forma P&L template"].map((x) => (
          <li key={x} className="flex items-start gap-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" /> {x}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-6 inline-block rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
      >
        Get the {state} bundle – ${price.toLocaleString("en-US")}
      </Link>
      <p className="mt-2 text-xs text-slate-500">Instant download after checkout.</p>
    </aside>
  );
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const price = await bundlePrice(g.bundle);
  const what = g.program ? (PROGRAM_HEADLINE[g.program] || g.program).replace(/^(a|an) /, "") : "your care business";
  const cta = g.bundle && price && g.state ? (
    <BundleCta href={`/go/${g.bundle}`} state={g.state} what={`a${/^[aeiou]/i.test(what) ? "n" : ""} ${what}`} price={price} />
  ) : null;

  // Split the article after its first section so the offer appears early, then again at the end.
  const firstSectionEnd = g.html.indexOf("<h2", 50);
  const [intro, rest] = firstSectionEnd > 0 ? [g.html.slice(0, firstSectionEnd), g.html.slice(firstSectionEnd)] : [g.html, ""];

  const related = allGuides().filter((x) => x.state === g.state && x.slug !== g.slug).slice(0, 12);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.excerpt,
      datePublished: g.date,
      dateModified: g.modified,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      mainEntityOfPage: `${SITE_URL}/guides/${g.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: g.title, item: `${SITE_URL}/guides/${g.slug}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="bg-white pt-24">
        <article className="mx-auto max-w-3xl px-4 pb-16">
          <nav className="text-sm text-slate-500">
            <Link href="/guides" className="hover:underline">Guides</Link>
            {g.state ? (
              <>
                {" / "}
                <Link href={`/guides#${g.state.toLowerCase().replace(/\s+/g, "-")}`} className="hover:underline">{g.state}</Link>
              </>
            ) : null}
          </nav>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{g.title}</h1>
          <p className="mt-3 text-sm text-slate-500">
            Updated {new Date(g.modified).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <div className="guide-body mt-8" dangerouslySetInnerHTML={{ __html: intro }} />
          {cta}
          {rest ? <div className="guide-body" dangerouslySetInnerHTML={{ __html: rest }} /> : null}
          {rest ? cta : null}

          {related.length ? (
            <section className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="text-xl font-bold text-slate-900">More {g.state} licensing guides</h2>
              <ul className="mt-4 space-y-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/guides/${r.slug}`} className="text-emerald-800 hover:underline">{r.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </main>
      <Footer />
    </>
  );
}

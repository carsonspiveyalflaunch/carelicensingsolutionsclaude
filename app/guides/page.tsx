import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { allGuides } from "@/lib/guides";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "/guides",
  "State Licensing Guides for Care Businesses | Care Licensing Solutions",
  "Free step-by-step guides to licensing costs, requirements and timelines for assisted living, home care, group homes, home health, hospice, adult day care and child care in all 50 states."
);

const anchor = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export default function GuidesIndex() {
  const byState = new Map<string, ReturnType<typeof allGuides>>();
  for (const g of allGuides()) {
    const s = g.state || "Other";
    byState.set(s, [...(byState.get(s) || []), g]);
  }
  const states = [...byState.keys()].sort();

  return (
    <>
      <Header />
      <main className="bg-white pt-24">
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">State Licensing Guides</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            How to license and open a care business in your state: requirements, costs, timelines and the agencies involved.
          </p>
          <nav aria-label="Jump to state" className="mt-6 flex flex-wrap gap-2">
            {states.map((s) => (
              <a key={s} href={`#${anchor(s)}`} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50">
                {s}
              </a>
            ))}
          </nav>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            {states.map((s) => (
              <section key={s} id={anchor(s)} className="scroll-mt-28">
                <h2 className="text-xl font-bold text-emerald-800">{s}</h2>
                <ul className="mt-3 space-y-2">
                  {byState.get(s)!.map((g) => (
                    <li key={g.slug}>
                      <Link href={`/guides/${g.slug}`} className="text-slate-800 hover:text-emerald-800 hover:underline">
                        {g.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

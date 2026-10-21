import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Shared layout for Terms, Refund Policy and Privacy Policy. */
export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <Header />
      <main className="bg-[#f7f8f6] text-[#1c2b22]">
        <div className="bg-[#16563a] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-12">
            <p className="text-xs uppercase tracking-widest text-white/70 mb-3">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
            <p className="mt-3 text-white/80 text-sm">Effective {LEGAL_EFFECTIVE_DATE}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-[15px] leading-7 text-[#334139] mb-8">{intro}</div>

          <nav aria-label="Contents" className="bg-white rounded-xl border border-[#e3e8e4] p-5 mb-10">
            <p className="font-semibold text-sm mb-3">Contents</p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm list-decimal list-inside">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-[#16563a] hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#16563a] mb-3">
                  {i + 1}. {s.title}
                </h2>
                <div className="legal-body space-y-3 text-[15px] leading-7 text-[#334139] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:text-[#16563a] [&_a]:underline [&_strong]:text-[#1c2b22]">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

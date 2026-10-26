"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, FileText } from "lucide-react";
import StateProgramSelect, { type CatalogChoice } from "./StateProgramSelect";
import { ASSET_LIST_PRICES } from "@/lib/value-stack";
import {
  MRR_BULLETS,
  MRR_PRICE_DOLLARS,
  checkoutHref,
  formatUsd,
  toEmbedUrl,
} from "@/lib/meta-funnel";
import { trackMetaViewContent } from "@/lib/meta-pixel";

const PROOF = [
  {
    quote: "Now making $73,910/month — Care Licensing Solutions helped her navigate California licensing.",
    name: "Luam M.",
    role: "Supported Living · California",
  },
  {
    quote: "Now making over $45,000/month with his group home.",
    name: "Brian S.",
    role: "Group Home Owner · California",
  },
];

function matchCode(choices: CatalogChoice[], raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const upper = value.toUpperCase();
  if (choices.some((item) => item.code === upper)) return upper;
  const byName = choices.find((item) => item.state.toLowerCase() === value.toLowerCase());
  return byName?.code || "";
}

function matchProgram(choices: CatalogChoice[], code: string, raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!code || !value) return "";
  return choices.find((item) => item.code === code && item.program.toLowerCase() === value)?.program || "";
}

export default function MarketResearchView({ choices }: { choices: CatalogChoice[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = matchCode(choices, searchParams.get("state") || "");
  const program = matchProgram(choices, code, searchParams.get("type") || searchParams.get("program") || "");
  const [offerState, setOfferState] = useState<{
    key: string;
    offer: { available?: boolean; checklist?: boolean; error?: string };
  } | null>(null);
  const video = toEmbedUrl(process.env.NEXT_PUBLIC_META_MRR_VIDEO_URL);

  useEffect(() => {
    trackMetaViewContent();
  }, []);

  const offerKey = `${code}|${program}`;
  const offer = code && program && offerState?.key === offerKey ? offerState.offer : null;

  useEffect(() => {
    if (!code || !program) return;
    let cancelled = false;
    const key = `${code}|${program}`;
    fetch(`/api/funnel/offer?state=${code}&type=${encodeURIComponent(program)}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setOfferState({ key, offer: body });
      })
      .catch(() => {
        if (!cancelled) setOfferState({ key, offer: { error: "Could not check this report." } });
      });
    return () => {
      cancelled = true;
    };
  }, [code, program]);

  const replaceParams = (next: { state?: string; type?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextState = next.state ?? code;
    const offered = choices.filter((item) => item.code === nextState).map((item) => item.program);
    const nextType = next.type ?? (offered.includes(program) ? program : "");
    if (nextState) params.set("state", nextState);
    else params.delete("state");
    if (nextType) params.set("type", nextType);
    else params.delete("type");
    params.delete("program");
    const qs = params.toString();
    router.replace(qs ? `/market-research?${qs}` : "/market-research", { scroll: false });
  };

  const selected = choices.find((item) => item.code === code && item.program === program) || null;
  const ready = Boolean(selected && offer?.available);
  const checking = Boolean(selected && !offer);
  const href = checkoutHref(code, program, searchParams.toString());
  const stateLabel = useMemo(() => selected?.state || "your state", [selected]);

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-emerald-950 to-slate-950 px-4 pb-16 pt-28 text-white sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
              For nurses and healthcare professionals
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
              See the market before you license a care business
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-200">
              You already know the care. This report shows the demand, the competition, the reimbursement, and where to
              open — written for one state and one program. It is the same Market Research Report PDF from the shop.
            </p>
            <ul className="mt-8 space-y-3 text-slate-100">
              {["50+ pages of state data", "Instant PDF download", "One-time payment of $47"].map((line) => (
                <li key={line} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-5 text-slate-950 shadow-xl sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">State Market Research Report</p>
            <p className="mt-2 text-4xl font-bold">
              <span className="mr-2 text-xl font-semibold text-slate-400 line-through">{formatUsd(ASSET_LIST_PRICES.report)}</span>
              {formatUsd(MRR_PRICE_DOLLARS)}
            </p>
            <p className="mt-1 text-sm text-slate-500">One-time. The shop listing stays {formatUsd(ASSET_LIST_PRICES.report)}.</p>
            <div className="mt-5">
              <StateProgramSelect
                choices={choices}
                code={code}
                program={program}
                onState={(state) => replaceParams({ state, type: "" })}
                onProgram={(type) => replaceParams({ type })}
              />
            </div>
            {selected && offer?.available === false && (
              <p className="mt-3 text-sm text-amber-800">The report for {stateLabel} {program} isn&apos;t ready yet. Choose another program.</p>
            )}
            <div className="mt-4">
              {ready ? (
                <Link
                  href={href}
                  className="flex w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Get the report — {formatUsd(MRR_PRICE_DOLLARS)}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white opacity-60"
                >
                  {!choices.length
                    ? "Reports are unavailable right now"
                    : checking
                      ? "Checking this report…"
                      : offer?.available === false
                        ? "Report isn't available yet"
                        : "Choose your state and program"}
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-sm text-slate-500">One-time payment · Instant download · Secure checkout by Stripe</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">Watch a short walkthrough</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            {video ? (
              <iframe
                src={video}
                title="Market Research Report walkthrough"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-300">
                Short walkthrough — video coming soon
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">What&apos;s inside</h2>
          <p className="mt-2 text-slate-600">
            {selected
              ? `${selected.state} ${selected.program}. 50+ pages, data-driven insights, PDF.`
              : "50+ pages, data-driven insights, PDF. Pick your state and program and the file matches that market."}
          </p>
          <ul className="mt-6 grid gap-3">
            {MRR_BULLETS.map((line) => (
              <li key={line} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-slate-950">Owners who used these materials</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {PROOF.map((item) => (
              <figure key={item.name} className="rounded-xl bg-slate-50 p-5">
                <div className="text-yellow-500" aria-hidden>★★★★★</div>
                <blockquote className="mt-3 text-sm leading-relaxed text-slate-700">&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <span className="block text-slate-500">{item.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">Questions</h2>
          <dl className="mt-6 space-y-4">
            {[
              ["What am I buying?", "The Market Research Report PDF for the state and program you pick. Same file as the shop listing."],
              ["Why is this $47?", "This page is a separate offer. The shop price does not change."],
              ["When do I get the file?", "On the thank-you page right after payment, and by email as a login link to your downloads."],
              ["Can I add the other documents later?", "After checkout you can add the Launch Kit — pro forma, checklist, and policy manual — and the $47 comes off that price for 7 days."],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-xl border border-slate-200 bg-white p-5">
                <dt className="font-semibold text-slate-950">{question}</dt>
                <dd className="mt-1 text-slate-600">{answer}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-slate-500">
            This is an informational report. You still file with your state agency. Read the{" "}
            <Link href="/refund-policy" className="font-medium text-emerald-700 underline">refund policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

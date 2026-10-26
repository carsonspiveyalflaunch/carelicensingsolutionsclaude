"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, FileText } from "lucide-react";
import StateProgramSelect, { type CatalogChoice } from "./StateProgramSelect";
import { ASSET_LIST_PRICES } from "@/lib/value-stack";
import {
  METHOD_NAME,
  MRR_BULLETS,
  MRR_PRICE_DOLLARS,
  READ_REPORT_STEPS,
  UPSELL_PRICE_DOLLARS,
  UPSELL_SAVINGS_DOLLARS,
  LAUNCH_KIT_PRICE_DOLLARS,
  MRR_CREDIT_DOLLARS,
  checkoutHref,
  formatUsd,
  toEmbedUrl,
} from "@/lib/meta-funnel";
import { trackMetaViewContent } from "@/lib/meta-pixel";

const PROOF = [
  {
    quote:
      "Now making $73,910/month — Care Licensing Solutions helped her navigate California Department of Developmental Services licensing with ease.",
    name: "Luam M.",
    role: "Supported Living · California",
  },
  {
    quote:
      "Now making over $45,000/month with his group home — Care Licensing Solutions helped him navigate California licensing and launch with confidence.",
    name: "Brian S.",
    role: "Group Home Owner · California",
  },
  {
    quote:
      "Landed 6 clients in just 2 months, now making $38,640/month with her day program — Care Licensing Solutions helped her navigate Virginia DBHDS licensing with confidence.",
    name: "Gamuchirai G.",
    role: "Community Engagement Services · Virginia",
  },
];

const SECRETS = [
  {
    kicker: "Secret 1 · The vehicle",
    title: "The map comes before the building",
    body: "Another degree, a logo, or a lease does not tell you if a program can pay in your state. The License-First Market Map is the Market Research Report for one state and one program. You read that file first.",
  },
  {
    kicker: "Secret 2 · You can read it",
    title: "It is written for someone who already knows care",
    body: "You do the clinical work. The report labels the business pages: who pays, the licensing steps, the staff you need, and a startup snapshot. The thank-you page includes a short checklist for which section to open first.",
  },
  {
    kicker: "Secret 3 · Your state is specific",
    title: "The file matches the program you pick",
    body: "Home care, home health, group homes, nursing agencies, assisted living, residential, and the other programs in the catalog each have their own report. If that PDF is not in the library yet, this page says so. You get the state and program you selected.",
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

  const orderCard = (id?: string) => (
    <div id={id} className="rounded-2xl bg-white p-5 text-slate-950 shadow-xl sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{METHOD_NAME}</p>
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
        <p className="mt-3 text-sm text-amber-800">
          The report for {stateLabel} {program} isn&apos;t ready yet. Choose another program.
        </p>
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
      <p className="mt-3 text-center text-sm text-slate-500">Instant PDF · One-time payment · Secure checkout by Stripe</p>
    </div>
  );

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-emerald-950 to-slate-950 px-4 pb-16 pt-28 text-white sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            For nurses, CNAs, therapists, and healthcare professionals
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
            See if your state and program are worth opening before you spend big
          </h1>
          <p className="mt-5 text-lg text-slate-200">
            Pick the state and the program. The {METHOD_NAME} is the 50–60 page Market Research Report: reimbursement,
            the licensing path, staffing, and a startup snapshot. Same PDF as the shop. You download it and decide.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-6xl items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
            {video ? (
              <iframe
                src={video}
                title="License-First Market Map walkthrough"
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
          {orderCard("order")}
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">The story</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">I licensed the business before I sold the paperwork</h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-slate-700">
            <p>
              I own a licensed ARF and an SLS in San Diego. Nurses, aides, and therapists tell me the same thing: the
              extra shifts are costing them a life, and they want a care business with their name on it.
            </p>
            <p>
              The expensive mistake is starting with a building, a logo, or a pile of forms. They still do not know the
              rate, the staffing load, or whether that program can carry a payroll in that state.
            </p>
            <p>
              The turn was the order. Look at the market, then license. I put the research I use with owners into one
              PDF per state and program and called it the {METHOD_NAME}. You already know the care. This file shows the
              market.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-4">
          {SECRETS.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{item.kicker}</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">What&apos;s inside the PDF</h2>
          <p className="mt-2 text-slate-600">
            {selected
              ? `${selected.state} ${selected.program}. 50–60 pages.`
              : "50–60 pages. The file matches the state and program you pick."}
          </p>
          <ul className="mt-6 grid gap-3">
            {MRR_BULLETS.map((line) => (
              <li key={line} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="font-semibold text-slate-950">Included: how to read your report</h3>
            <p className="mt-1 text-sm text-slate-600">
              A short checklist on the thank-you page. It is part of this purchase, and it is not a separate product.
            </p>
            <ol className="mt-4 space-y-3">
              {READ_REPORT_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3 text-slate-700">
                  <span className="font-semibold text-emerald-800">{index + 1}.</span>
                  <span>
                    <span className="font-semibold text-slate-950">{step.title}. </span>
                    {step.body}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">The stack</h2>
          <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <li className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-semibold text-slate-950">State + program Market Research Report</p>
                <p className="mt-1 text-sm text-slate-600">50–60 page PDF. The same file as the shop listing.</p>
              </div>
              <p className="shrink-0 font-semibold text-slate-700">{formatUsd(ASSET_LIST_PRICES.report)}</p>
            </li>
            <li className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-semibold text-slate-950">How to read your report</p>
                <p className="mt-1 text-sm text-slate-600">Checklist on the thank-you page so you know where to start.</p>
              </div>
              <p className="shrink-0 font-semibold text-slate-700">Included</p>
            </li>
            <li className="flex items-baseline justify-between bg-slate-50 p-5">
              <span className="font-semibold text-slate-700">Shop price of the report</span>
              <span className="text-lg font-semibold text-slate-400 line-through">{formatUsd(ASSET_LIST_PRICES.report)}</span>
            </li>
            <li className="flex items-baseline justify-between p-5">
              <span className="text-lg font-bold text-slate-950">You pay today</span>
              <span className="text-3xl font-bold text-emerald-800">{formatUsd(MRR_PRICE_DOLLARS)}</span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            After you pay, your {formatUsd(MRR_CREDIT_DOLLARS)} credit is open for 7 days on the Launch Kit. The public
            kit is {formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}. With the credit you pay {formatUsd(UPSELL_PRICE_DOLLARS)} —
            about {formatUsd(UPSELL_SAVINGS_DOLLARS)} off. That window starts at purchase. This page has no countdown.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-slate-950">Owners who launched with these materials</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            These are care business owners. Their revenue is their business, not a promised result of this $47 PDF.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
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
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">If you buy</h2>
            <p className="mt-3 text-slate-600">
              You get the PDF for the state and program you picked, the reading checklist, and 7 days to add the Launch
              Kit at {formatUsd(UPSELL_PRICE_DOLLARS)}. You can skip the kit and keep the report.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">If you wait</h2>
            <p className="mt-3 text-slate-600">
              The shop still lists this report at {formatUsd(ASSET_LIST_PRICES.report)}. The public Launch Kit stays{" "}
              {formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}. The $47 credit exists only after you buy on this page.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">The guarantee, in the words of our policy</h2>
          <div className="mt-4 space-y-3 text-slate-600">
            <p>
              This is a digital file. Once we deliver access, the sale is final. Access means the login link in your
              email or the purchase in your dashboard, whichever comes first.
            </p>
            <p>
              We refund a duplicate charge, an order we cannot restore within five business days, or a file we cannot
              fix or replace within five business days. Ask within 14 days of purchase. A denied application, a change
              of mind, or a disagreement with the projections is not a refund reason.
            </p>
            <p>
              Bought the wrong state or program? Email us within 7 days. We may exchange it for another of equal or
              lower price. That is a courtesy, and it is not a refund.
            </p>
            <p>
              <Link href="/refund-policy" className="font-medium text-emerald-700 underline">
                Read the refund policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">Questions</h2>
          <dl className="mt-6 space-y-4">
            {[
              ["What am I buying?", "The Market Research Report PDF for one state and one program, plus the how-to-read checklist on the thank-you page."],
              ["Is this a different report than the shop?", `Same file. The shop price stays ${formatUsd(ASSET_LIST_PRICES.report)}. This page is ${formatUsd(MRR_PRICE_DOLLARS)}.`],
              ["When do I get it?", "On the thank-you page after payment, and by email as a login link to your downloads."],
              ["Do I have to talk to anyone?", "No. You pick a state and program, pay, and download. There is no call on this offer."],
              ["What is the $647?", `For 7 days after you buy, you can add the Launch Kit — pro forma, checklist, policy manual, and the academy bonuses — for ${formatUsd(UPSELL_PRICE_DOLLARS)}. That is the ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)} kit with your ${formatUsd(MRR_CREDIT_DOLLARS)} credit applied, about ${formatUsd(UPSELL_SAVINGS_DOLLARS)} off.`],
              ["What if my state is not listed?", "Choose another program, or come back when that file is in the library. We will not swap in a different state's report."],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-xl border border-slate-200 bg-white p-5">
                <dt className="font-semibold text-slate-950">{question}</dt>
                <dd className="mt-1 text-slate-600">{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-700">Get the map</p>
          <h2 className="mt-2 text-center text-2xl font-bold text-slate-950">
            {formatUsd(MRR_PRICE_DOLLARS)} for the report. Then you decide.
          </h2>
          <div className="mt-6">{orderCard()}</div>
          <p className="mt-6 text-slate-600">
            P.S. If the report says the market is thin, you spent {formatUsd(MRR_PRICE_DOLLARS)} to learn that. The
            shop price of this file stays {formatUsd(ASSET_LIST_PRICES.report)}.
          </p>
        </div>
      </section>
    </main>
  );
}

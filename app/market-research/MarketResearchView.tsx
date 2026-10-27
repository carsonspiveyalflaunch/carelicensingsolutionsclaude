"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import LogoImg from "@/public/assets/images/logo-dark-bg.png";
import StateProgramSelect, { type CatalogChoice } from "./StateProgramSelect";
import { ASSET_LIST_PRICES } from "@/lib/value-stack";
import {
  METHOD_NAME,
  MRR_BULLETS,
  MRR_PRICE_DOLLARS,
  READ_REPORT_STEPS,
  checkoutHref,
  formatUsd,
  toEmbedUrl,
} from "@/lib/meta-funnel";
import { trackMetaViewContent } from "@/lib/meta-pixel";

const COL = "mx-auto w-full max-w-[680px] px-4";
const WIDE = "mx-auto w-full max-w-[1080px] px-4";
const SHOP = formatUsd(ASSET_LIST_PRICES.report);
const PRICE = formatUsd(MRR_PRICE_DOLLARS);

const SAMPLE_COVERS = [
  {
    src: "/previews/california-assisted-living-facilities-complete-bundle/report.webp",
    alt: "Sample Market Research Report cover for California assisted living",
    label: "Assisted living",
  },
  {
    src: "/previews/california-personal-home-care-complete-bundle/report.webp",
    alt: "Sample Market Research Report cover for California in-home care",
    label: "In-home care",
  },
  {
    src: "/previews/california-residential-care-dd-complete-bundle/report.webp",
    alt: "Sample Market Research Report cover for California residential care",
    label: "Residential care",
  },
];

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

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "What am I buying?",
    a: "The Market Research Report PDF for one state and one program, plus the how-to-read checklist on the thank-you page. The file is the License-First Market Map.",
  },
  {
    q: "Is this a different report than the shop?",
    a: `Same file. The shop price stays ${SHOP}. This page is ${PRICE}.`,
  },
  {
    q: "When do I get it?",
    a: "On the thank-you page after payment, and by email as a login link to your downloads.",
  },
  {
    q: "Do I have to get on a call?",
    a: "No. You pick a state and a program, pay, and download. There is no call on this offer.",
  },
  {
    q: "What if my state or program is not listed?",
    a: "Choose another program, or come back when that file is in the library. We will not swap in a different state’s report.",
  },
  {
    q: "What is the refund policy?",
    a: (
      <>
        This is a digital file. Once we deliver access, the sale is final. Access means the login link in your email or
        the purchase in your dashboard, whichever comes first. We refund a duplicate charge, an order we cannot restore
        within five business days, or a file we cannot fix or replace within five business days. Ask within 14 days of
        purchase. A denied application, a change of mind, or a disagreement with the projections is not a refund reason.
        The wrong state or program may be exchanged within 7 days at our discretion. That is a courtesy, and it is not a
        refund.{" "}
        <Link href="/refund-policy" className="font-semibold text-emerald-400 underline">
          Read the refund policy
        </Link>
        .
      </>
    ),
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

function scrollToOrder(event: React.MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById("order");
  if (!el) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function YellowCta({
  href,
  children,
  sub,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  sub?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const className =
    "mx-auto flex w-full max-w-[560px] flex-col items-center justify-center rounded-[10px] bg-emerald-600 px-6 py-4 text-center text-white shadow-[0_10px_30px_rgba(5,150,105,0.28)] transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  const inner = (
    <>
      <span className="text-[17px] font-black uppercase leading-tight tracking-wide sm:text-xl">{children}</span>
      {sub ? (
        <span className="mt-1 text-[11px] font-semibold uppercase leading-tight tracking-wide text-white/80">{sub}</span>
      ) : null}
    </>
  );
  if (href.startsWith("#")) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

function ReportCta() {
  return (
    <div className="mt-10">
      <YellowCta href="#order" onClick={scrollToOrder} sub={`Was ${SHOP} · Today ${PRICE} · Instant PDF`}>
        Get the report
      </YellowCta>
    </div>
  );
}

function CheckRow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <li className={`flex gap-3 text-left text-base leading-relaxed ${onDark ? "text-white/90" : "text-neutral-800"}`}>
      <Check className={`mt-0.5 h-5 w-5 shrink-0 ${onDark ? "text-emerald-400" : "text-emerald-600"}`} strokeWidth={3} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function FaqList() {
  const [open, setOpen] = useState(0);
  return (
    <div className="border-t border-white/15">
      {FAQ.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q} className="border-b border-white/15">
            <h3>
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-bold sm:text-xl ${
                  isOpen ? "text-emerald-400" : "text-white"
                }`}
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                {item.q}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 ${isOpen ? "rotate-180 text-emerald-400" : "text-white"}`}
                  aria-hidden
                />
              </button>
            </h3>
            {isOpen ? <div className="pb-5 text-base leading-relaxed text-white/85">{item.a}</div> : null}
          </div>
        );
      })}
    </div>
  );
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
  const [orderVisible, setOrderVisible] = useState(false);
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

  useEffect(() => {
    const el = document.getElementById("order");
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOrderVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const orderLabel = !choices.length
    ? "Reports are unavailable right now"
    : checking
      ? "Checking this report…"
      : offer?.error
        ? "Could not check this report"
        : offer?.available === false
          ? "Report isn’t available yet"
          : "Choose your state and program";

  return (
    <div id="top" className="bg-black pb-24 text-white lg:pb-0">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-emerald-900/70 bg-black">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            <Image src={LogoImg} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" priority />
            <span className="hidden truncate text-sm font-extrabold uppercase tracking-wide text-white min-[480px]:inline sm:text-base">
              Care Licensing <span className="text-emerald-400">Solutions</span>
            </span>
          </a>
          <a
            href="#order"
            onClick={scrollToOrder}
            className="shrink-0 rounded-[8px] bg-emerald-600 px-3 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(5,150,105,0.35)] hover:bg-emerald-500 sm:px-4 sm:text-sm"
          >
            Get the report
          </a>
        </div>
      </header>

      <section className="bg-gradient-to-b from-emerald-950 via-black to-black px-4 pb-16 pt-28 text-center sm:pb-20 sm:pt-32">
        <div className="mx-auto max-w-[720px]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400 sm:text-sm">
            For nurses, CNAs, therapists, and healthcare pros
          </p>
          <h1 className="mt-4 text-[2rem] font-black uppercase leading-[1.05] tracking-tight sm:text-6xl">
            The market comes before the building
          </h1>
          <div className="mx-auto mt-5 h-1 w-24 bg-emerald-500" />
          <p className="mx-auto mt-6 max-w-[640px] text-lg leading-relaxed text-white/90">
            The {METHOD_NAME} is the Market Research Report for one state and one program. Who pays, the licensing
            path, the staff you need, and a startup snapshot. 50–60 pages. You download it and decide what to build.
          </p>
          <p className="mt-6 text-lg">
            <span className="mr-2 text-white/60 line-through">{SHOP}</span>
            <span className="text-4xl font-black text-emerald-400">{PRICE}</span>
          </p>
          <p className="mt-1 text-sm text-white/70">One-time. The shop listing stays {SHOP}.</p>
          <div className="mt-8">
            <YellowCta href="#order" onClick={scrollToOrder} sub="Instant PDF · One state and one program">
              Get the report — {PRICE}
            </YellowCta>
          </div>
        </div>
        {video ? (
          <div className="mx-auto mt-10 w-full max-w-3xl">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
              <iframe
                src={video}
                title="License-First Market Map walkthrough"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="bg-slate-100 px-4 py-14 text-neutral-950 sm:py-16">
        <article className="mx-auto max-w-[680px] rounded-[28px] bg-white px-6 py-10 shadow-[0_18px_50px_rgba(0,0,0,0.12)] sm:px-10 sm:py-12">
          <Image
            src="/carson-headshot.jpg"
            alt="Carson, founder of Care Licensing Solutions"
            width={112}
            height={112}
            className="mx-auto h-28 w-28 rounded-full object-cover"
          />
          <h2 className="mt-6 text-center text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            A message from Carson
          </h2>
          <p className="mt-3 text-center text-sm font-bold uppercase leading-snug tracking-wide text-emerald-700">
            Licensed residential care and licensed in-home care support in California
          </p>
          <div className="mt-6 space-y-4 text-[17px] leading-8 text-neutral-800">
            <p>
              I own licensed residential care and licensed in-home care support in California. I built ALF Launch. That
              work became Care Licensing Solutions.
            </p>
            <p>
              Nurses, CNAs, therapists, and other healthcare pros tell me the same thing. The extra shifts are costing
              them a life. They want a care business with their name on it.
            </p>
            <p>
              The formula starts with the market. I call that file the {METHOD_NAME}. It is the Market Research Report
              for one state and one program: who pays, the licensing path, the staff you need, and a startup snapshot.
            </p>
            <p>
              I used to charge about $6,000 for the full service foundation. The foundation of that work is this
              report. Today it is {PRICE}.
            </p>
            <p>
              More than 200 owners nationwide have used these materials, across multiple program types. The expensive
              mistake is still the order. A building, a logo, and a stack of forms, before anyone reads the market.
              Read this first.
            </p>
          </div>
        </article>

        <div className="mx-auto mt-8 max-w-[680px] overflow-hidden rounded-2xl bg-emerald-950 text-center text-white shadow-xl">
          <div className="h-1.5 bg-emerald-500" />
          <p className="px-6 py-8 text-lg font-bold leading-relaxed sm:px-10 sm:text-xl">
            The {METHOD_NAME} is for you if you are a nurse, CNA, therapist, or healthcare pro who wants a licensed care
            business — and you want the market for your state and program before you spend on a building, a logo, or
            forms.
          </p>
        </div>
        <div className="mx-auto max-w-[680px]">
          <ReportCta />
          <p className="mt-4 text-center text-sm text-neutral-700">One state. One program. Instant PDF.</p>
        </div>
      </section>

      <section className="bg-black py-16 sm:py-20">
        <div className={WIDE}>
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">The order of operations</p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
                Read the market. Then build.
              </h2>
              <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-white/90">
                <p>
                  Another degree does not tell you if a program can pay in your state. A logo does not. A lease does
                  not. You already know the care. This file shows the market.
                </p>
                <p>
                  The report labels the business pages: who pays, the licensing steps, the staff you need, and a
                  startup snapshot. The thank-you page includes a short checklist for which section to open first. It
                  is part of this purchase. It is not a separate product.
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-emerald-400">The vehicle</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-white/90">
                  The map comes before the building. You read one state and one program, then you decide what to spend.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-emerald-400">Written for you</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-white/90">
                  You do the clinical work. The pages are labeled so a clinician can read the business without a call.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-emerald-400">Your state is specific</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-white/90">
                  Home care, home health, group homes, assisted living, residential, and the other programs in the
                  catalog each have their own report. If that PDF is not in the library yet, this page says so. You get
                  the state and program you selected.
                </p>
              </div>
            </div>
          </div>
          <ReportCta />
        </div>
      </section>

      <section className="bg-white py-16 text-neutral-950 sm:py-20">
        <div className={COL}>
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">The PDF</p>
          <h2 className="mt-3 text-center text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            What’s inside the report
          </h2>
          <p className="mt-4 text-center text-[17px] leading-relaxed text-neutral-700">
            {selected
              ? `${selected.state} ${selected.program}. 50–60 pages. Same file as the shop.`
              : "50–60 pages. The file matches the state and program you pick. Same file as the shop."}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {SAMPLE_COVERS.map((cover) => (
              <figure key={cover.src} className="text-center">
                <div className="overflow-hidden rounded-xl bg-slate-100 shadow-[0_16px_40px_rgba(6,78,59,0.18)] ring-1 ring-emerald-900/10">
                  <Image src={cover.src} alt={cover.alt} width={640} height={820} className="h-auto w-full" />
                </div>
                <figcaption className="mt-2 text-[11px] font-bold uppercase tracking-wide text-emerald-800 sm:text-xs">
                  {cover.label}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-neutral-500">
            Sample covers from California. The PDF you download is the state and program you pick.
          </p>
          <ul className="mt-8 space-y-4">
            {MRR_BULLETS.map((line) => (
              <CheckRow key={line}>{line}</CheckRow>
            ))}
          </ul>
          <div className="mt-10 overflow-hidden rounded-2xl bg-emerald-950 text-white">
            <div className="h-1 bg-emerald-500" />
            <div className="px-6 py-7">
            <h3 className="text-lg font-black uppercase tracking-tight text-emerald-400">How to read your report</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              A short checklist on the thank-you page. Included with this purchase.
            </p>
            <ol className="mt-5 space-y-4">
              {READ_REPORT_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                  <span className="font-black text-emerald-400">{index + 1}.</span>
                  <span>
                    <span className="font-bold text-white">{step.title}. </span>
                    {step.body}
                  </span>
                </li>
              ))}
            </ol>
            </div>
          </div>
          <ReportCta />
        </div>
      </section>

      <section className="bg-emerald-950 py-16 sm:py-20">
        <div className={WIDE}>
          <h2 className="text-center text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            Owners who launched with these materials
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-white/75">
            These are care business owners. Their revenue is their business. It is not a promised result of this {PRICE}{" "}
            PDF.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PROOF.map((item) => (
              <figure key={item.name} className="flex h-full flex-col rounded-2xl bg-white p-6 text-neutral-900">
                <div className="text-emerald-600" aria-hidden>
                  ★★★★★
                </div>
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed">&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-bold">{item.name}</span>
                  <span className="mt-0.5 block text-neutral-500">{item.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <ReportCta />
        </div>
      </section>

      <section className="bg-black py-16 sm:py-20">
        <div className={WIDE}>
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-emerald-400 sm:text-4xl">
                Who this is not for
              </h2>
              <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-white/90">
                <p>
                  This is not for anyone hunting a shortcut, a done-for-you license, or a call where someone else
                  decides. There is no consult on this offer.
                </p>
                <p>
                  If you will not read a 50–60 page report, this is not for you. If you are set on a building, a logo,
                  and a stack of forms before you know who pays, this is not for you.
                </p>
                <p>The market does not move because the brand looks finished.</p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
                Who it’s for
              </h2>
              <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-white/90">
                <p>
                  You are a nurse, a CNA, a therapist, or another healthcare professional. You want a licensed care
                  business with your name on it.
                </p>
                <p>
                  You will pick one state and one program. You will read who pays, what the license takes, who you have
                  to hire, and what it costs to start.
                </p>
                <p>You want the research this company starts with, on paper, before you spend.</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-[760px] text-center">
            <h3 className="text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
              This is the order you will run
            </h3>
            <p className="mt-5 text-lg leading-relaxed text-white/90">
              The <span className="font-black text-emerald-400">{METHOD_NAME}</span> shows you{" "}
              <span className="font-black text-emerald-400">who pays</span>, the{" "}
              <span className="font-black text-emerald-400">licensing path</span>, the{" "}
              <span className="font-black text-emerald-400">staff</span> you need, and a{" "}
              <span className="font-black text-emerald-400">startup snapshot</span> — for the state and program you pick.
            </p>
          </div>
          <ReportCta />
        </div>
      </section>

      <section id="order" className="scroll-mt-24 bg-slate-100 py-16 text-neutral-950 sm:py-20">
        <div className={COL}>
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">One report</p>
          <h2 className="mt-3 text-center text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            Get the {METHOD_NAME}
          </h2>
          <p className="mt-4 text-center text-[17px] leading-relaxed text-neutral-700">
            One state. One program. The shop listing stays {SHOP}. Today it is {PRICE}.
          </p>

          <div className="mx-auto mt-8 max-w-[520px] overflow-hidden rounded-2xl bg-emerald-950 text-white shadow-2xl ring-1 ring-emerald-700/40">
            <div className="h-1.5 bg-emerald-500" />
            <div className="px-5 py-7 sm:px-7 sm:py-8">
            <p className="text-center text-lg text-white/45 line-through">Was {SHOP}</p>
            <p className="mt-1 text-center text-5xl font-black tracking-tight sm:text-6xl">Now {PRICE}</p>
            <p className="mt-3 text-center text-xs font-black uppercase tracking-[0.16em] text-emerald-400">
              {METHOD_NAME}
            </p>
            {selected ? (
              <p className="mt-3 text-center text-sm text-white/80">
                {selected.state} · {selected.program}
              </p>
            ) : null}
            <ul className="mt-6 space-y-3">
              <CheckRow onDark>50–60 page Market Research Report for the state and program you pick</CheckRow>
              <CheckRow onDark>Same PDF as the shop listing</CheckRow>
              <CheckRow onDark>How to read your report, on the thank-you page</CheckRow>
              <CheckRow onDark>Instant download after checkout</CheckRow>
            </ul>
            <div className="mt-6">
              <StateProgramSelect
                choices={choices}
                code={code}
                program={program}
                tone="onDark"
                onState={(state) => replaceParams({ state, type: "" })}
                onProgram={(type) => replaceParams({ type })}
              />
            </div>
            {selected && offer?.available === false ? (
              <p className="mt-3 text-sm text-white">
                The report for {stateLabel} {program} isn’t ready yet. Choose another program.
              </p>
            ) : null}
            {offer?.error ? <p className="mt-3 text-sm text-white">{offer.error}</p> : null}
            <div className="mt-5">
              {ready ? (
                <YellowCta href={href} sub="One-time · Instant PDF · Secure checkout by Stripe">
                  Get the report — {PRICE}
                </YellowCta>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center rounded-[10px] bg-white/10 px-6 py-4 text-center text-[17px] font-black uppercase tracking-wide text-white/80"
                >
                  {orderLabel}
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 text-neutral-950 sm:py-20">
        <div className={COL}>
          <h2 className="text-center text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            The guarantee, in the words of our policy
          </h2>
          <div className="mt-6 space-y-4 text-[17px] leading-8 text-neutral-800">
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
              <Link href="/refund-policy" className="font-semibold text-emerald-800 underline">
                Read the refund policy
              </Link>
              .
            </p>
          </div>
          <ReportCta />
        </div>
      </section>

      <section className="bg-emerald-950 py-16 sm:py-20">
        <div className={COL}>
          <h2 className="text-center text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            Get questions? <span className="text-emerald-400">We’ve got answers</span>
          </h2>
          <div className="mt-8">
            <FaqList />
          </div>
          <ReportCta />
        </div>
      </section>

      <section className="bg-black py-16 sm:py-20">
        <div className={COL}>
          <h2 className="text-center text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            {PRICE} for the report. Then you decide.
          </h2>
          <p className="mt-4 text-center text-[17px] leading-relaxed text-white/80">
            The shop still lists this file at {SHOP}. On this page the report is {PRICE}. You pick the state and the
            program. You download it. You decide what to build.
          </p>
          <ReportCta />
        </div>
      </section>

      <footer className="bg-black px-4 pb-10 pt-6 text-center">
        <Image src={LogoImg} alt="" width={56} height={56} className="mx-auto h-14 w-14 object-contain" />
        <p className="mt-3 text-sm font-bold uppercase tracking-wide text-white">Care Licensing Solutions</p>
        <p className="mt-4 text-xs text-white/55">Copyright © {new Date().getFullYear()} Care Licensing Solutions</p>
        <p className="mt-2 text-xs text-white/55">
          <Link href="/refund-policy" className="underline">
            Refund policy
          </Link>
          <span aria-hidden> · </span>
          <Link href="/terms" className="underline">
            Terms
          </Link>
          <span aria-hidden> · </span>
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
        </p>
      </footer>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black px-3 pt-2.5 lg:hidden ${
          orderVisible ? "hidden" : ""
        }`}
        style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
      >
        <a
          href="#order"
          onClick={scrollToOrder}
          className="flex w-full items-center justify-center rounded-[10px] bg-emerald-600 px-4 py-3.5 text-sm font-black uppercase tracking-wide text-white hover:bg-emerald-500"
        >
          Get the report — {PRICE}
        </a>
      </div>
    </div>
  );
}

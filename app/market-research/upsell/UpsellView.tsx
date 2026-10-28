"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Play } from "lucide-react";
import AcademyModuleList from "../../components/AcademyModuleList";
import BundlePreviews from "../../components/BundlePreviews";
import BundleValueStack from "../../components/BundleValueStack";
import { DocumentFeatureGrid } from "../../components/DocumentFeatureCard";
import CourseCommunitySection from "../../course/components/CourseCommunitySection";
import { ACADEMY_TOTALS } from "@/lib/academy-curriculum";
import { trackPurchase } from "@/lib/gads";
import {
  LAUNCH_KIT_PRICE_DOLLARS,
  METHOD_NAME,
  UPSELL_PRICE_DOLLARS,
  formatUsd,
  launchKitHref,
  reportBuyerKitPriceLine,
  thankYouHref,
} from "@/lib/meta-funnel";
import { trackMetaPurchase } from "@/lib/meta-pixel";
import { previewBundleFor } from "@/lib/previews";
import { ASSET_LIST_PRICES, COMMUNITY_EXTRAS, COURSE_DETAIL, COURSE_PRICE_DOLLARS } from "@/lib/value-stack";
import { useLaunchKitUpsell } from "../useLaunchKitUpsell";

type Order = {
  amount: number;
  contentIds: string[];
  stateName: string;
  program: string;
  creditExpiresAt: string;
  creditActive: boolean;
  upsellTaken: boolean;
  launchKitUrl: string;
  error?: string;
};

const OWNER_STORIES = [
  {
    name: "Gamuchirai G.",
    role: "Community Engagement Services Agency · Virginia",
    amount: "$38,640/mo",
    quote: "Landed 6 clients in just 2 months, now making $38,640/month with her day program.",
    loom: "https://www.loom.com/embed/ad790c8419b54ad7b923562818a9a205?hide_owner=true&hide_title=true&hide_share=true",
  },
  {
    name: "Luam M.",
    role: "Supported Living · California",
    amount: "$73,910/mo",
    quote: "Now making $73,910/month — Care Licensing Solutions helped her navigate California licensing.",
    loom: "https://www.loom.com/embed/cfd77f378d384ccead7d1498315e9eb4?hide_owner=true&hide_title=true&hide_share=true",
  },
  {
    name: "Brian S.",
    role: "Group Home Owner · California",
    amount: "$45,000+/mo",
    quote: "Now making over $45,000/month with his group home.",
    loom: "https://www.loom.com/embed/9d5cdf735cca4e40850460f85aaf1070?hide_owner=true&hide_title=true&hide_share=true",
  },
];

const ACCEPT_CLASS =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800 disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";

export default function UpsellView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id") || "";
  const preview = searchParams.get("preview") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [story, setStory] = useState<string | null>(null);
  const [previewExpiry] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
  const { accept, loading, error: payError } = useLaunchKitUpsell(sessionId);
  const previewOrder = useMemo<Order | null>(() => {
    if (!preview) return null;
    return {
      amount: 47,
      contentIds: [],
      stateName: "Arizona",
      program: "Residential Care (DD)",
      creditExpiresAt: previewExpiry,
      creditActive: true,
      upsellTaken: false,
      launchKitUrl: launchKitHref("AZ", "Residential Care (DD)"),
    };
  }, [preview, previewExpiry]);

  useEffect(() => {
    if (preview || !sessionId) return;
    let cancelled = false;
    fetch(`/api/funnel/order?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load this order.");
        return body as Order;
      })
      .then((body) => {
        if (cancelled) return;
        setOrder(body);
        trackMetaPurchase(sessionId, body.amount, body.contentIds);
        if (body.upsellTaken) router.replace(thankYouHref(sessionId));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this order.");
      });
    return () => {
      cancelled = true;
    };
  }, [preview, sessionId, router]);

  const shown = previewOrder ?? order;

  useEffect(() => {
    if (preview || !sessionId) return;
    let cancelled = false;
    fetch(`/api/verify-purchase?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body?.purchase_id) trackPurchase(body.purchase_id, Number(body.amount));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [preview, sessionId]);

  useEffect(() => {
    if (!shown) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "9rem";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [shown]);

  const decline = () => {
    if (sessionId) {
      fetch("/api/funnel/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => undefined);
    }
    router.push(thankYouHref(sessionId, { declined: true }));
  };

  if (!preview && (!sessionId || error)) {
    return (
      <main className="bg-slate-50 px-4 py-32 text-center">
        <p className="text-lg font-semibold text-slate-900">{error || "This page needs the checkout session from Stripe."}</p>
      </main>
    );
  }

  if (!shown) {
    return (
      <main className="bg-slate-50 px-4 py-32 text-center text-slate-600">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-700" />
        <p className="mt-3">Confirming your payment…</p>
      </main>
    );
  }

  const price = shown.creditActive ? UPSELL_PRICE_DOLLARS : LAUNCH_KIT_PRICE_DOLLARS;
  const pages = previewBundleFor(shown.stateName, shown.program);
  const kitLabel = [shown.stateName, shown.program].filter(Boolean).join(" ");
  const creditDate = shown.creditExpiresAt ? new Date(shown.creditExpiresAt).toLocaleDateString() : "";
  const place = shown.stateName || "your state";
  const sampleCaption = pages.usingPublishedSample
    ? `Example pages from a real kit. Yours is built for ${kitLabel || place}. The thumbnails are from a published ${pages.sampleTitle} kit so you can see the actual documents. The download is written for ${place}.`
    : `These are pages from the ${kitLabel || "Launch Kit"}. Real paper. Click one.`;

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-emerald-950 to-slate-950 px-4 pb-16 pt-28 text-white sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
              {kitLabel ? `${kitLabel} is paid` : `Your ${METHOD_NAME} is paid`}
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
              You bought the map. You still can&apos;t open.
            </h1>
            <p className="mt-5 text-lg text-slate-200">
              Good. That was the right first check. The {METHOD_NAME}
              {kitLabel ? ` for ${kitLabel}` : ""} tells you whether this market can pay. It does not get you licensed.
              It does not staff the shift. It does not write the policies a surveyor or a bank will ask for. It does not
              hand a lender a P&amp;L. Leave with only the report and you own a PDF and a stall.
            </p>
            <ul className="mt-6 space-y-3 text-slate-100">
              {[
                ["No checklist", "One missed filing and the state sends the packet back."],
                ["No policy manual", "Surveyors and banks do not take a market study as your policies."],
                ["No pro forma", "You walk in with rates and no model a lender can underwrite."],
                ["No academy", "You cold-start hiring, intake, billing, and the building alone."],
              ].map(([title, body]) => (
                <li key={title} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <span>
                    <span className="font-semibold text-white">{title}. </span>
                    {body}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-emerald-100">
              {shown.creditActive
                ? `${reportBuyerKitPriceLine()} This price ends ${creditDate}. After ${creditDate} the same download is ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}.`
                : `The 7-day credit window is closed. The kit is ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)} on the Launch Kit page.`}
            </p>
          </div>
          <OfferCard order={shown} price={price} accept={accept} loading={loading} payError={payError} onDecline={decline} />
        </div>
      </section>

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Map vs build</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-4xl">The report alone is a half-finished buy</h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-700">
            You did the part most people skip. You read the market before you signed a lease. That file is the map.
            A map does not open the doors. The old way is a consultant, a guess, and a stalled application. The kit is
            the build: the packet, the policies, the numbers, and the operators who already did it.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-300 bg-slate-950 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">The old way</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-200">
                <li>Hand the launch to a consultant at $15,000–$25,000 and wait on their calendar.</li>
                <li>Guess the packet. Eat a rejected application. Start the clock over.</li>
                <li>Write the policy manual from a blank page. Months, if you finish it.</li>
                <li>Ask a lender to fund a feeling. They will not.</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">The kit — {formatUsd(price)}</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-800">
                <li>Licensing checklist in filing order for {kitLabel || "your state and program"}.</li>
                <li>Policy manual already written. PDF and editable Word. Put your agency name on it.</li>
                <li>Pro forma a lender can read. Change the assumptions and see the profit.</li>
                <li>11-module academy, weekly calls, and the people who finance, broker, insure, and keep the books.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="kit-samples" className="scroll-mt-24 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">The documents</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Stop picturing the kit. Look at the pages.</h2>
          <p className="mt-3 max-w-3xl text-slate-700">
            Four files decide whether you can license, borrow, and open. The report is one of them, and you already
            have it. The checklist, the manual, and the pro forma are the ones that move a file. These are real pages,
            not a mockup.
          </p>
          <div className="mt-8">
            <BundlePreviews
              productSlug={pages.productSlug}
              stateName={pages.usingPublishedSample ? undefined : shown.stateName}
              title={pages.usingPublishedSample ? "Example pages from a real kit" : undefined}
              caption={sampleCaption}
            />
          </div>
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">What each file actually does</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Open every list. This is the inside of the download, written for {place}.
            </p>
            <div className="mt-8">
              <DocumentFeatureGrid defaultOpen showPitch />
            </div>
          </div>
          <InlineOffer
            note={
              shown.creditActive
                ? `You just saw the pages. Decline and you keep the map and none of the build. Credit ends ${creditDate}. Then this kit is ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}.`
                : "You just saw the pages. The report is one file. The kit is the rest of the launch."
            }
            order={shown}
            price={price}
            accept={accept}
            loading={loading}
            payError={payError}
            onDecline={decline}
          />
        </div>
      </section>

      <section id="academy" className="scroll-mt-24 border-t border-slate-200 bg-white px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-black px-4 py-1.5 text-xs font-bold text-green-300 sm:text-sm">
              {ACADEMY_TOTALS.modules} MODULES
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-950 sm:text-4xl">This used to cost thousands. It still didn&apos;t include the files.</h2>
            <p className="mx-auto mt-3 max-w-3xl text-slate-700">
              {COURSE_DETAIL} People paid for the teaching and still wrote the manual themselves. Here the academy sits
              on top of the checklist, the policies, and the pro forma. Open any module. Play the sample. Then decide
              if you want to cold-start operations without it.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-2 rounded-lg bg-white p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
            {[
              [String(ACADEMY_TOTALS.modules), "Modules"],
              [ACADEMY_TOTALS.videos.toLocaleString("en-US"), "Videos"],
              [ACADEMY_TOTALS.minutes.toLocaleString("en-US"), "Minutes"],
              [ACADEMY_TOTALS.resources.toLocaleString("en-US"), "Resources"],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold text-slate-950 sm:text-2xl">{value}</div>
                <div className="text-xs text-slate-600">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <AcademyModuleList />
          </div>
          <InlineOffer
            note="Eleven modules. Sample every one. The network under them is lenders, brokers, tax, insurance, fractional HR, bookkeepers, and the software other owners run."
            order={shown}
            price={price}
            accept={accept}
            loading={loading}
            payError={payError}
            onDecline={decline}
          />
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {COMMUNITY_EXTRAS.map((extra) => (
            <div key={extra.title} className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Included with the kit</p>
              <h2 className="mt-2 text-2xl font-bold">{extra.title}</h2>
              <p className="mt-3 text-slate-300">{extra.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 pb-4 pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Who you can actually call</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-4xl">A PDF cannot introduce you</h2>
          <p className="mt-4 text-lg text-slate-700">
            The report names the market. The kit puts you in the room: specialty lenders, business brokers, tax
            strategists, insurance agents, fractional HR, bookkeepers, and the software and systems other owners
            already run. Weekly call recordings sit on top, owners working live licensing questions.
          </p>
        </div>
      </section>
      <CourseCommunitySection animate={false} />

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-slate-950">They did not stop at a market file</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Same materials. They licensed and opened. The report was the start. The kit was the build.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {OWNER_STORIES.map((item) => (
              <figure key={item.name} className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-bold text-emerald-800">{item.amount}</p>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className="mt-4">
                  <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </figcaption>
                {story === item.name ? (
                  <div className="mt-4 aspect-video overflow-hidden rounded-lg bg-black">
                    <iframe
                      src={item.loom}
                      title={`${item.name} story`}
                      className="h-full w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStory(item.name)}
                    className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-emerald-800 underline"
                  >
                    <Play className="h-4 w-4" />
                    Watch story
                  </button>
                )}
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14">
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Finish it</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Leave half-done, or open.</h2>
            <p className="mt-3 text-slate-700">
              Bought apart, the files and the academy are{" "}
              {formatUsd(
                ASSET_LIST_PRICES.report +
                  ASSET_LIST_PRICES.pnl +
                  ASSET_LIST_PRICES.checklist +
                  ASSET_LIST_PRICES.manual +
                  COURSE_PRICE_DOLLARS,
              )}
              . The public kit is {formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}.
              {shown.creditActive
                ? ` ${reportBuyerKitPriceLine()} That price lasts until ${creditDate}. After that date the kit is ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}. Declining keeps the map and leaves licensing, staffing, policies, and the open on you.`
                : ` The credit window is closed. The kit is ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}. The report still does not license, staff, or open the business.`}
            </p>
            <div className="mt-6">
              <BundleValueStack stateName={shown.stateName} price={price} />
            </div>
          </div>
          <OfferCard order={shown} price={price} accept={accept} loading={loading} payError={payError} onDecline={decline} />
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 pr-20 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:pr-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          {shown.creditActive && (
            <p className="text-center text-xs font-semibold text-slate-800">
              Credit ends {creditDate}. After that this kit is {formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}.
            </p>
          )}
          <AcceptControl order={shown} price={price} accept={accept} loading={loading} />
          <DeclineButton onDecline={decline} />
          {payError && <p className="text-center text-sm text-red-700">{payError}</p>}
        </div>
      </div>
    </main>
  );
}

function OfferCard({
  order,
  price,
  accept,
  loading,
  payError,
  onDecline,
}: {
  order: Order;
  price: number;
  accept: () => void;
  loading: boolean;
  payError: string;
  onDecline: () => void;
}) {
  return (
    <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">One-time add-on</p>
      <p className="mt-2 text-4xl font-bold text-slate-950">
        {order.creditActive && (
          <span className="mr-2 text-xl font-semibold text-slate-400 line-through">{formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}</span>
        )}
        {formatUsd(price)}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        {order.creditActive
          ? `${reportBuyerKitPriceLine()} Same download. This price ends ${new Date(order.creditExpiresAt).toLocaleDateString()}.`
          : "The 7-day credit is closed. The Launch Kit page has the current price."}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {[
          "The report is already yours. It does not file the license.",
          "Checklist, policy manual, and pro forma, or the launch stalls.",
          "Academy, weekly calls, and the owner network.",
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <AcceptControl order={order} price={price} accept={accept} loading={loading} />
      </div>
      <DeclineButton onDecline={onDecline} />
      {payError && <p className="mt-2 text-sm text-red-700">{payError}</p>}
    </div>
  );
}

function InlineOffer({
  note,
  order,
  price,
  accept,
  loading,
  payError,
  onDecline,
}: {
  note?: string;
  order: Order;
  price: number;
  accept: () => void;
  loading: boolean;
  payError: string;
  onDecline: () => void;
}) {
  return (
    <div className="mx-auto mt-12 max-w-xl text-center">
      {note ? <p className="mb-4 text-base font-semibold leading-relaxed text-slate-950">{note}</p> : null}
      <AcceptControl order={order} price={price} accept={accept} loading={loading} />
      <DeclineButton onDecline={onDecline} />
      {payError && <p className="mt-2 text-sm text-red-700">{payError}</p>}
    </div>
  );
}

function AcceptControl({
  order,
  price,
  accept,
  loading,
}: {
  order: Order;
  price: number;
  accept: () => void;
  loading: boolean;
}) {
  if (order.creditActive) {
    return (
      <button type="button" onClick={accept} disabled={loading} className={ACCEPT_CLASS}>
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        {loading ? "Adding the Launch Kit…" : `Add the Launch Kit — ${formatUsd(price)}`}
      </button>
    );
  }
  return (
    <a href={order.launchKitUrl} className={ACCEPT_CLASS}>
      View the Launch Kit
    </a>
  );
}

function DeclineButton({ onDecline }: { onDecline: () => void }) {
  return (
    <button type="button" onClick={onDecline} className="mt-3 w-full py-2 text-sm font-semibold text-slate-600 underline">
      No thanks — take me to my report
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
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
  MRR_CREDIT_DOLLARS,
  UPSELL_PRICE_DOLLARS,
  UPSELL_SAVINGS_DOLLARS,
  formatUsd,
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
  const { accept, loading, error: payError } = useLaunchKitUpsell(sessionId);

  useEffect(() => {
    if (preview) {
      setOrder({
        amount: 47,
        contentIds: [],
        stateName: "Arizona",
        program: "Residential Care (DD)",
        creditExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        creditActive: true,
        upsellTaken: false,
        launchKitUrl: "/launch-kit?state=AZ&type=Residential%20Care%20(DD)",
      });
      return;
    }
    if (!sessionId) return;
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
    if (!order) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "7.5rem";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [order]);

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

  if (!order) {
    return (
      <main className="bg-slate-50 px-4 py-32 text-center text-slate-600">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-700" />
        <p className="mt-3">Confirming your payment…</p>
      </main>
    );
  }

  const price = order.creditActive ? UPSELL_PRICE_DOLLARS : LAUNCH_KIT_PRICE_DOLLARS;
  const pages = previewBundleFor(order.stateName, order.program);
  const kitLabel = [order.stateName, order.program].filter(Boolean).join(" ");
  const sampleCaption = pages.usingPublishedSample
    ? kitLabel
      ? `These are real pages from the ${pages.sampleTitle} kit. Your ${kitLabel} download is this same set of documents, written for ${order.stateName || "your state"}.`
      : `These are real pages from the ${pages.sampleTitle} kit: market research, pro forma P&L, licensing checklist, and the policy manual.`
    : undefined;

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-emerald-950 to-slate-950 px-4 pb-16 pt-28 text-white sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Your {METHOD_NAME} is paid</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
              Add the Care Business Launch Kit for {formatUsd(price)}
            </h1>
            <p className="mt-5 text-lg text-slate-200">
              {kitLabel ? `${kitLabel}. ` : ""}
              You have the market file. The kit adds the pro forma, the licensing checklist, the policy manual, and the
              academy that ships with the {formatUsd(LAUNCH_KIT_PRICE_DOLLARS)} bundle.
              {order.creditActive
                ? ` Your ${formatUsd(MRR_CREDIT_DOLLARS)} report credit is applied — about ${formatUsd(UPSELL_SAVINGS_DOLLARS)} off — until ${new Date(order.creditExpiresAt).toLocaleDateString()}. You pay ${formatUsd(UPSELL_PRICE_DOLLARS)}.`
                : " The report credit has ended."}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {["Real report pages", "Pro forma P&L", "Licensing checklist", "Policy manual", "11 academy modules"].map((item) => (
                <li key={item} className="rounded-full border border-emerald-700/60 bg-emerald-900/40 px-3 py-1 text-sm text-emerald-100">
                  {item}
                </li>
              ))}
            </ul>
            <a href="#kit-samples" className="mt-6 inline-block text-sm font-semibold text-emerald-300 underline">
              See the pages and the academy
            </a>
          </div>
          <OfferCard order={order} price={price} accept={accept} loading={loading} payError={payError} onDecline={decline} />
        </div>
      </section>

      <section id="kit-samples" className="scroll-mt-24 bg-white px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <BundlePreviews
            productSlug={pages.productSlug}
            stateName={pages.usingPublishedSample ? undefined : order.stateName}
            title={pages.usingPublishedSample ? `Look inside the ${pages.sampleTitle} kit` : undefined}
            caption={sampleCaption}
          />
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">See what&apos;s inside</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Market research, the licensing checklist, the policy manual, and the pro forma — the same outlines as the public site, under the pages above.
            </p>
            <div className="mt-8">
              <DocumentFeatureGrid defaultOpen />
            </div>
          </div>
          <InlineOffer order={order} price={price} accept={accept} loading={loading} payError={payError} onDecline={decline} />
        </div>
      </section>

      <section id="academy" className="scroll-mt-24 border-t border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-black px-4 py-1.5 text-xs font-bold text-green-300 sm:text-sm">
              {ACADEMY_TOTALS.modules} MODULES
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-950 sm:text-4xl">Operational Success Academy</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              {COURSE_DETAIL} Open any module and play a sample lesson.
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
          <InlineOffer order={order} price={price} accept={accept} loading={loading} payError={payError} onDecline={decline} />
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

      <CourseCommunitySection animate={false} />

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-slate-950">Owners who launched with these materials</h2>
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
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">Everything you get</h2>
            <p className="mt-2 text-slate-600">
              {formatUsd(
                ASSET_LIST_PRICES.report +
                  ASSET_LIST_PRICES.pnl +
                  ASSET_LIST_PRICES.checklist +
                  ASSET_LIST_PRICES.manual +
                  COURSE_PRICE_DOLLARS,
              )}{" "}
              if you bought the files and the academy separately.
              {order.creditActive ? ` Your price on this page is ${formatUsd(UPSELL_PRICE_DOLLARS)}.` : ` The kit on its own is ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}.`}
            </p>
            <div className="mt-6">
              <BundleValueStack stateName={order.stateName} price={price} />
            </div>
          </div>
          <OfferCard order={order} price={price} accept={accept} loading={loading} payError={payError} onDecline={decline} />
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 pr-20 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:pr-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          <AcceptControl order={order} price={price} accept={accept} loading={loading} />
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
          ? `${formatUsd(MRR_CREDIT_DOLLARS)} report credit applied. About ${formatUsd(UPSELL_SAVINGS_DOLLARS)} off the ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)} kit. Same download, no appointment.`
          : "Credit window closed. The Launch Kit page has the current price."}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {["Market research report — already yours", "Pro forma, checklist, and policy manual", "Full academy, calls, and owner network"].map((line) => (
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
    <div className="mx-auto mt-12 max-w-md text-center">
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

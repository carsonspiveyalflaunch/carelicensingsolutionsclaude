"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { trackBeginCheckout } from "@/lib/gads";
import { formatUsd } from "@/lib/meta-funnel";
import { metaBrowserFields, pauseForMetaPixel, trackMetaInitiateCheckout } from "@/lib/meta-pixel";
import { payIn4 } from "@/lib/pay-later";
import {
  CONTENT_STATE_PACK,
  STATE_PACK_FUNNEL,
  STATE_PACK_PRICE_DOLLARS,
  statePackFilePrices,
  statePackHref,
  statePackPerPackTotal,
  statePackSeparateTotal,
  statePackSuccessPath,
} from "@/lib/state-pack-shared";
import { cancelUrlWithTracking } from "@/lib/tracking-params";

export type StateChoice = { code: string; state: string; program: string };

const PROOF = [
  {
    name: "Gamuchirai G.",
    role: "Community Engagement Services Agency • Virginia",
    quote:
      "Landed 6 clients in just 2 months, now making $38,640/month with her day program — Care Licensing Solutions helped her navigate Virginia DBHDS licensing with confidence.",
  },
  {
    name: "Luam M.",
    role: "Supported Living for the Developmentally Disabled • California",
    quote:
      "Now making $73,910/month — Care Licensing Solutions helped her navigate California Department of Developmental Services licensing with ease.",
  },
  {
    name: "Brian S.",
    role: "Group Home Owner • California",
    quote:
      "Now making over $45,000/month with his group home — Care Licensing Solutions helped him navigate California licensing and launch with confidence.",
  },
] as const;

function matchCode(choices: StateChoice[], raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const upper = value.toUpperCase();
  if (choices.some((item) => item.code === upper)) return upper;
  return choices.find((item) => item.state.toLowerCase() === value.toLowerCase())?.code || "";
}

export default function StatePackCheckout({ choices }: { choices: StateChoice[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = matchCode(choices, searchParams.get("state") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const states = new Map<string, string>();
  for (const item of choices) states.set(item.code, item.state);
  const stateOptions = [...states.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const programs = choices
    .filter((item) => item.code === code)
    .map((item) => item.program)
    .sort((a, b) => a.localeCompare(b));
  const stateName = states.get(code) || "";
  const place = stateName || "your state";
  const total = STATE_PACK_PRICE_DOLLARS;
  const promo = (searchParams.get("promo") || "").trim();
  const filePrices = statePackFilePrices();
  const perPack = statePackPerPackTotal();
  const separateTotal = statePackSeparateTotal(programs.length);
  const afterpayEach = payIn4(total);

  useEffect(() => {
    if (!searchParams.has("type") && !searchParams.has("program") && !searchParams.has("p")) return;
    router.replace(statePackHref(code, searchParams.toString()), { scroll: false });
  }, [code, router, searchParams]);

  const pay = async () => {
    if (!code) return;
    setLoading(true);
    setError("");
    const promoCode = new URLSearchParams(window.location.search).get("promo")?.trim() || "";
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnel: STATE_PACK_FUNNEL,
          state: code,
          successUrl: `${window.location.origin}${statePackSuccessPath(window.location.search)}`,
          ...(promoCode ? { promotionCode: promoCode } : {}),
          cancelUrl: cancelUrlWithTracking(
            window.location.origin,
            statePackHref(code, window.location.search),
            window.location.search,
          ),
          ...metaBrowserFields(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "Checkout could not start");
      const charged = typeof body.amount === "number" ? body.amount : total;
      const eventId = typeof body.sessionId === "string" ? body.sessionId : "";
      trackBeginCheckout(charged);
      trackMetaInitiateCheckout(charged, [CONTENT_STATE_PACK], eventId);
      await pauseForMetaPixel();
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout could not start");
      setLoading(false);
    }
  };

  const focusState = () => {
    const select = document.getElementById("state-pack-state");
    select?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (select instanceof HTMLSelectElement) select.focus();
  };

  const onCta = () => {
    if (!code) {
      focusState();
      return;
    }
    void pay();
  };

  return (
    <main className="bg-white pb-28 lg:pb-0" data-testid="state-pack-checkout">
      <section className="bg-gradient-to-br from-emerald-950 to-slate-950 px-4 pb-16 pt-28 text-white sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Full state pack</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Launch a licensed care business in {place}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-200 sm:text-xl">
              Every program pack we publish for {place}, the full kit in each one, and Skool community access.
              One payment of {formatUsd(total)}. Start your application this week.
            </p>
            <ul className="mt-8 space-y-3 text-slate-100">
              {[
                "Market research, pro forma, policy manual, and licensing checklist in every pack",
                "Skool community with the Operational Success Academy",
                "Download as soon as Stripe confirms payment",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-emerald-100">
              <TrustPill icon={Lock} label="Secure checkout by Stripe" />
              <TrustPill icon={ShieldCheck} label="Instant digital delivery" />
              <TrustPill icon={CreditCard} label="Afterpay and Zip on the next page" />
            </div>
          </div>

          <div id="state-pack-offer" className="rounded-3xl bg-white p-5 text-slate-950 shadow-2xl sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Due today</p>
            <p className="mt-1 text-5xl font-black tracking-tight text-slate-950">{formatUsd(total)}</p>
            {separateTotal != null && perPack != null && (
              <p className="mt-2 text-sm text-slate-500">
                <span className="line-through">{formatUsd(separateTotal)}</span>
                {" "}if these files were bought separately ({programs.length} {programs.length === 1 ? "pack" : "packs"} × {formatUsd(perPack)})
              </p>
            )}
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Or pay over time with Afterpay/Zip. Afterpay is 4 payments of {afterpayEach}.
            </p>

            <label className="mt-6 block text-sm font-semibold text-slate-800" htmlFor="state-pack-state">
              Your state
              <select
                id="state-pack-state"
                data-testid="state-pack-state"
                value={code}
                onChange={(event) => {
                  router.replace(statePackHref(event.target.value, searchParams.toString()), { scroll: false });
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="">Select your state</option>
                {stateOptions.map(([abbr, name]) => (
                  <option key={abbr} value={abbr}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            {!choices.length && (
              <p className="mt-3 text-sm text-amber-800">States aren&apos;t available right now. Refresh in a moment.</p>
            )}
            {programs.length > 0 && (
              <p className="mt-3 text-sm text-slate-600">
                {programs.length} program {programs.length === 1 ? "pack" : "packs"} in {stateName}, listed below.
              </p>
            )}
            {promo && (
              <p className="mt-3 text-sm text-slate-600">Your promotion code will be applied on the secure Stripe page.</p>
            )}

            <button
              type="button"
              onClick={onCta}
              disabled={loading || (!code && choices.length === 0)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
              {loading ? "Opening secure checkout…" : code ? `Pay ${formatUsd(total)}` : "Choose your state"}
            </button>
            {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
            <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
              Start your application this week. Stripe collects your email. You can add a promotion code there.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">What you unlock</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {stateName ? `Everything in the ${stateName} pack` : "Everything in the state pack"}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              {stateName
                ? `One checkout opens every program pack we currently publish for ${stateName}. Each pack is the full kit, not a single report.`
                : "Choose a state. One checkout opens every program pack we currently publish there. Each pack is the full kit, not a single report."}
            </p>
            {programs.length > 0 && (
              <ul className="mt-6 space-y-2">
                {programs.map((program) => (
                  <li key={program} className="flex items-start gap-2 text-slate-800">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
                    <span className="font-semibold">{program}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border-2 border-emerald-800 bg-white">
            <div className="bg-emerald-800 px-5 py-4 text-white">
              <p className="text-lg font-bold">Full kit in every program pack</p>
              <p className="text-sm text-emerald-100">Prices are what each file lists for when bought on its own.</p>
            </div>
            <ul className="divide-y divide-slate-200">
              {(filePrices || []).map((line) => (
                <li key={line.label} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                    <p className="text-sm font-semibold text-slate-900">{line.label}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold text-slate-700">
                    {formatUsd(line.price)}
                    <span className="block text-xs font-normal text-slate-500">sold separately</span>
                  </p>
                </li>
              ))}
              <li className="flex items-start justify-between gap-4 bg-emerald-50 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Skool community access</p>
                  <p className="mt-1 text-sm text-slate-600">
                    The Operational Success Academy (11 modules, 124 lessons), weekly call recordings, and other owners
                    licensing and launching their agencies.
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-emerald-800">Included</p>
              </li>
            </ul>
            <div className="bg-slate-50 px-5 py-4">
              {separateTotal != null && perPack != null ? (
                <div className="flex items-baseline justify-between text-sm text-slate-600">
                  <span>
                    {programs.length} {programs.length === 1 ? "pack" : "packs"} × {formatUsd(perPack)} if bought separately
                  </span>
                  <span className="font-semibold line-through">{formatUsd(separateTotal)}</span>
                </div>
              ) : perPack != null ? (
                <p className="text-sm text-slate-600">
                  One program pack&apos;s four files list at {formatUsd(perPack)} if bought separately. {formatUsd(total)} covers every pack for the state you choose.
                </p>
              ) : null}
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-bold text-slate-950">You pay</span>
                <span className="text-3xl font-black text-emerald-800">{formatUsd(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-emerald-950 px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">Owners who launched with Care Licensing Solutions</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-emerald-100">
            Any examples of other people&apos;s results are not typical and are not a guarantee of yours.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PROOF.map((item) => (
              <figure key={item.name} className="rounded-2xl bg-white/10 p-5">
                <blockquote className="text-sm leading-relaxed text-white">&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="block font-bold">{item.name}</span>
                  <span className="text-emerald-100">{item.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 text-slate-950 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">The guarantee, in the words of our policy</h2>
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-700">
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
        </div>
      </section>

      <section className="bg-black px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
            {formatUsd(total)} to start in {place}
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Start your application this week. Or pay over time with Afterpay/Zip.
          </p>
          <button
            type="button"
            onClick={onCta}
            disabled={loading || (!code && choices.length === 0)}
            className="mx-auto mt-8 flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            {loading ? "Opening secure checkout…" : code ? `Pay ${formatUsd(total)}` : "Choose your state"}
          </button>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-900/10 bg-white/95 px-3 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-950">{stateName || "Choose your state"}</p>
            <p className="truncate text-xs text-slate-500">
              {formatUsd(total)} · or pay over time with Afterpay/Zip
            </p>
          </div>
          <button
            type="button"
            onClick={onCta}
            disabled={loading || (!code && choices.length === 0)}
            className="shrink-0 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Opening…" : code ? `Pay ${formatUsd(total)}` : "Select state"}
          </button>
        </div>
        {error && <p className="mx-auto mt-2 max-w-lg text-xs text-red-700">{error}</p>}
      </div>
    </main>
  );
}

function TrustPill({ icon: Icon, label }: { icon: typeof Lock; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
      <Icon className="h-4 w-4 text-emerald-300" aria-hidden />
      {label}
    </span>
  );
}

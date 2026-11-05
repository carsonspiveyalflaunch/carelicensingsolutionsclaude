"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { BUNDLE_RESOURCES } from "@/lib/bundle-offer";
import { trackBeginCheckout } from "@/lib/gads";
import { formatUsd } from "@/lib/meta-funnel";
import { metaBrowserFields, pauseForMetaPixel, trackMetaInitiateCheckout } from "@/lib/meta-pixel";
import {
  CONTENT_STATE_PACK,
  STATE_PACK_FUNNEL,
  STATE_PACK_PRICE_DOLLARS,
  statePackHref,
  statePackSuccessPath,
} from "@/lib/state-pack-shared";
import { cancelUrlWithTracking } from "@/lib/tracking-params";

export type StateChoice = { code: string; state: string; program: string };

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
  const total = STATE_PACK_PRICE_DOLLARS;
  const promo = (searchParams.get("promo") || "").trim();

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

  return (
    <main className="bg-slate-50 px-4 pb-16 pt-28" data-testid="state-pack-checkout">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Full state pack</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Every program pack for your state</h1>
          <p className="mt-3 text-slate-600">
            {stateName
              ? `${stateName}. You pay ${formatUsd(total)} today. That unlocks every file in each program pack we have for this state, plus Skool community access.`
              : `Choose your state. ${formatUsd(total)} unlocks every program pack we have for that state, plus Skool community access.`}
          </p>
          <p className="mt-3 text-slate-600">
            Each pack includes the {BUNDLE_RESOURCES.join(", ")}. You are not picking a single report.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="state-pack-state">
              Your state
              <select
                id="state-pack-state"
                data-testid="state-pack-state"
                value={code}
                onChange={(event) => {
                  router.replace(statePackHref(event.target.value, searchParams.toString()), { scroll: false });
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="">Select your state</option>
                {stateOptions.map(([abbr, name]) => (
                  <option key={abbr} value={abbr}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            {programs.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700">Included for {stateName}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {programs.map((program) => (
                    <li key={program}>{program}</li>
                  ))}
                </ul>
              </div>
            )}
            {!choices.length && (
              <p className="mt-3 text-sm text-amber-800">States aren&apos;t available right now. Refresh in a moment.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-950">Order</h2>
          <div className="mt-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="font-semibold text-slate-900">{stateName ? `${stateName} program packs` : "All program packs"}</p>
              <p className="text-sm text-slate-500">Every file in each pack, plus Skool community access</p>
            </div>
            <p className="font-semibold text-slate-900">{formatUsd(total)}</p>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-semibold text-slate-700">Due today</span>
            <span className="text-2xl font-bold text-slate-950">{formatUsd(total)}</span>
          </div>
          {promo && (
            <p className="mt-3 text-sm text-slate-600">Your promotion code will be applied on the secure Stripe page.</p>
          )}
          <button
            type="button"
            onClick={pay}
            disabled={!code || loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            {loading ? "Opening secure checkout…" : `Pay ${formatUsd(total)}`}
          </button>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <p className="mt-3 text-center text-sm text-slate-500">
            Stripe collects your email. You can add a promotion code there. Card, Afterpay, and Zip stay available on that page when they are enabled for this account.
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import StateProgramSelect, { type CatalogChoice } from "../StateProgramSelect";
import { trackBeginCheckout } from "@/lib/gads";
import { ASSET_LIST_PRICES } from "@/lib/value-stack";
import {
  METHOD_NAME,
  MRR_PRICE_DOLLARS,
  checkoutHref,
  formatUsd,
  funnelContentIds,
} from "@/lib/meta-funnel";
import { TRACKING_KEYS, cancelUrlWithTracking } from "@/lib/tracking-params";
import { metaBrowserFields, pauseForMetaPixel, trackMetaInitiateCheckout } from "@/lib/meta-pixel";
import { funnelHref, funnelOfferQuery, programQueryValue } from "@/lib/program-codes";

function matchCode(choices: CatalogChoice[], raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const upper = value.toUpperCase();
  if (choices.some((item) => item.code === upper)) return upper;
  return choices.find((item) => item.state.toLowerCase() === value.toLowerCase())?.code || "";
}

function matchProgram(choices: CatalogChoice[], code: string, raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!code || !value) return "";
  return choices.find((item) => item.code === code && item.program.toLowerCase() === value)?.program || "";
}

export default function CheckoutView({ choices }: { choices: CatalogChoice[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = matchCode(choices, searchParams.get("state") || "");
  const program = matchProgram(choices, code, programQueryValue(searchParams));
  const [offerState, setOfferState] = useState<{
    key: string;
    offer: { available?: boolean };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const offerKey = `${code}|${program}`;
  const offer = code && program && offerState?.key === offerKey ? offerState.offer : null;

  useEffect(() => {
    if (!code || !program) return;
    let cancelled = false;
    const key = `${code}|${program}`;
    fetch(`/api/funnel/offer?${funnelOfferQuery(code, program)}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        setOfferState({ key, offer: body });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [code, program]);

  const replaceParams = (next: { state?: string; type?: string }) => {
    const nextState = next.state ?? code;
    const offered = choices.filter((item) => item.code === nextState).map((item) => item.program);
    const nextType = next.type ?? (offered.includes(program) ? program : "");
    router.replace(funnelHref("/market-research/checkout", nextState, nextType, searchParams.toString()), { scroll: false });
  };

  const selected = choices.find((item) => item.code === code && item.program === program) || null;
  const total = MRR_PRICE_DOLLARS;

  const pay = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    const extra = new URLSearchParams();
    const incoming = new URLSearchParams(window.location.search);
    for (const key of TRACKING_KEYS) {
      const value = incoming.get(key);
      if (value) extra.set(key, value);
    }
    const tracking = extra.toString();
    const promo = incoming.get("promo")?.trim() || "";
    const successUrl = `${window.location.origin}/market-research/upsell?session_id={CHECKOUT_SESSION_ID}${tracking ? `&${tracking}` : ""}`;
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnel: "meta_mrr",
          state: selected.code,
          program: selected.program,
          successUrl,
          ...(promo ? { promotionCode: promo } : {}),
          cancelUrl: cancelUrlWithTracking(
            window.location.origin,
            checkoutHref(selected.code, selected.program, window.location.search),
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
      trackMetaInitiateCheckout(charged, funnelContentIds(), eventId);
      await pauseForMetaPixel();
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout could not start");
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-50 px-4 pb-16 pt-28">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">{METHOD_NAME}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Your Market Research Report</h1>
          <p className="mt-3 text-slate-600">
            {selected
              ? `${selected.state} ${selected.program}. You pay ${formatUsd(MRR_PRICE_DOLLARS)} today for the report and the how-to-read checklist.`
              : `Choose the state and program. You pay ${formatUsd(MRR_PRICE_DOLLARS)} for the report and the how-to-read checklist.`}
          </p>
          <p className="mt-3 text-slate-600">
            After payment you download the PDF and a short guide for which pages to read first.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <StateProgramSelect
              choices={choices}
              code={code}
              program={program}
              onState={(state) => replaceParams({ state, type: "" })}
              onProgram={(type) => replaceParams({ type })}
            />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            <Link href={code ? funnelHref("/market-research", code, program, searchParams.toString()) : "/market-research"} className="text-emerald-700 underline">
              Back to the report details
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-950">Order</h2>
          <div className="mt-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="font-semibold text-slate-900">State Market Research Report</p>
              <p className="text-sm text-slate-500">
                PDF and how-to-read checklist · shop value {formatUsd(ASSET_LIST_PRICES.report)}
              </p>
            </div>
            <p className="font-semibold text-slate-900">{formatUsd(MRR_PRICE_DOLLARS)}</p>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-semibold text-slate-700">Due today</span>
            <span className="text-2xl font-bold text-slate-950">{formatUsd(total)}</span>
          </div>

          <button
            type="button"
            onClick={pay}
            disabled={!selected || offer?.available === false || loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            {loading ? "Opening secure checkout…" : `Pay ${formatUsd(total)}`}
          </button>
          {offer?.available === false && selected && (
            <p className="mt-2 text-sm text-amber-800">That report isn&apos;t available yet. Choose another program.</p>
          )}
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <p className="mt-3 text-center text-sm text-slate-500">Stripe collects your email and card. Digital delivery. No call.</p>
        </div>
      </div>
    </main>
  );
}

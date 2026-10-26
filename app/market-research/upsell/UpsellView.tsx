"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import BundleValueStack from "../../components/BundleValueStack";
import { trackPurchase } from "@/lib/gads";
import {
  LAUNCH_KIT_PRICE_DOLLARS,
  MRR_CREDIT_DOLLARS,
  UPSELL_PRICE_DOLLARS,
  UPSELL_SAVINGS_DOLLARS,
  formatUsd,
  thankYouHref,
} from "@/lib/meta-funnel";
import { trackMetaPurchase } from "@/lib/meta-pixel";
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

export default function UpsellView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const { accept, loading, error: payError } = useLaunchKitUpsell(sessionId);

  useEffect(() => {
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
  }, [sessionId, router]);

  useEffect(() => {
    if (!sessionId) return;
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
  }, [sessionId]);

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

  if (!sessionId || error) {
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

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-emerald-950 to-slate-950 px-4 pb-16 pt-28 text-white sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Your report is paid</p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
            Add the Care Business Launch Kit for {formatUsd(order.creditActive ? UPSELL_PRICE_DOLLARS : LAUNCH_KIT_PRICE_DOLLARS)}
          </h1>
          <p className="mt-5 text-lg text-slate-200">
            {order.stateName && order.program ? `${order.stateName} ${order.program}. ` : ""}
            The kit is the report you just bought, plus the pro forma P&L, licensing checklist, and policy manual.
            {order.creditActive
              ? ` Your ${formatUsd(MRR_CREDIT_DOLLARS)} report credit is applied to the ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)} kit — about ${formatUsd(UPSELL_SAVINGS_DOLLARS)} off — until ${new Date(order.creditExpiresAt).toLocaleDateString()}. You pay ${formatUsd(UPSELL_PRICE_DOLLARS)}.`
              : " The report credit has ended."}
          </p>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <ul className="space-y-3 text-slate-700">
              {[
                "Market Research Report — already yours",
                "Pro Forma P&L in Excel",
                "Licensing checklist for this state and program",
                "Policy & procedure manual, PDF and editable Word",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <BundleValueStack stateName={order.stateName} price={order.creditActive ? UPSELL_PRICE_DOLLARS : LAUNCH_KIT_PRICE_DOLLARS} />
            </div>
          </div>
          <div className="h-fit rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">One-time add-on</p>
            <p className="mt-2 text-4xl font-bold text-slate-950">
              {order.creditActive && (
                <span className="mr-2 text-xl font-semibold text-slate-400 line-through">{formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}</span>
              )}
              {formatUsd(order.creditActive ? UPSELL_PRICE_DOLLARS : LAUNCH_KIT_PRICE_DOLLARS)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {order.creditActive
                ? `${formatUsd(MRR_CREDIT_DOLLARS)} report credit applied. About ${formatUsd(UPSELL_SAVINGS_DOLLARS)} off the ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)} kit. Same download, no appointment.`
                : "Credit window closed. The Launch Kit page has the current price."}
            </p>
            {order.creditActive ? (
              <button
                type="button"
                onClick={accept}
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800 disabled:opacity-70"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {loading ? "Adding the Launch Kit…" : `Add the Launch Kit — ${formatUsd(UPSELL_PRICE_DOLLARS)}`}
              </button>
            ) : (
              <a
                href={order.launchKitUrl}
                className="mt-5 flex w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800"
              >
                View the Launch Kit
              </a>
            )}
            <button type="button" onClick={decline} className="mt-3 w-full py-3 text-sm font-semibold text-slate-600 underline">
              No thanks — take me to my report
            </button>
            {payError && <p className="mt-2 text-sm text-red-700">{payError}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

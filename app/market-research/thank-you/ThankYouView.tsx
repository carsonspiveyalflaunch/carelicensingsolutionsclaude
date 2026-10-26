"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import AccessForm from "../../access/AccessForm";
import { trackPurchase } from "@/lib/gads";
import {
  CONTENT_LAUNCH_KIT,
  LAUNCH_KIT_PRICE_DOLLARS,
  MRR_CREDIT_DOLLARS,
  UPSELL_PRICE_DOLLARS,
  formatUsd,
} from "@/lib/meta-funnel";
import { trackMetaPurchase } from "@/lib/meta-pixel";
import { useLaunchKitUpsell } from "../useLaunchKitUpsell";

type Order = {
  amount: number;
  contentIds: string[];
  stateName: string;
  program: string;
  email: string | null;
  creditExpiresAt: string;
  creditActive: boolean;
  upsellTaken: boolean;
  launchKitUrl: string;
};

type DownloadFile = { label: string; name: string; url: string };

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function countdownLabel(expiresAt: string, now: number): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return "ended";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function ThankYouView() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const upsellSession = searchParams.get("upsell_session") || "";
  const upsellPi = searchParams.get("upsell_pi") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [error, setError] = useState("");
  const { accept, loading, error: payError } = useLaunchKitUpsell(sessionId);
  const now = useNow(Boolean(order?.creditActive && !order.upsellTaken));

  useEffect(() => {
    if (!sessionId) return;
    const extra = new URLSearchParams({ session_id: sessionId });
    if (upsellSession) extra.set("upsell_session", upsellSession);
    if (upsellPi) extra.set("upsell_pi", upsellPi);
    let cancelled = false;
    Promise.all([
      fetch(`/api/funnel/order?${extra}`).then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load this order.");
        return body as Order;
      }),
      fetch(`/api/funnel/downloads?${extra}`).then(async (res) => {
        const body = await res.json().catch(() => ({}));
        return (res.ok ? body.files : []) as DownloadFile[];
      }),
    ])
      .then(([nextOrder, nextFiles]) => {
        if (cancelled) return;
        setOrder(nextOrder);
        setFiles(nextFiles || []);
        trackMetaPurchase(sessionId, nextOrder.amount, nextOrder.contentIds);
        if (nextOrder.upsellTaken) {
          trackMetaPurchase(`${sessionId}:${CONTENT_LAUNCH_KIT}`, UPSELL_PRICE_DOLLARS, [CONTENT_LAUNCH_KIT]);
          trackPurchase(`${sessionId}:${CONTENT_LAUNCH_KIT}`, UPSELL_PRICE_DOLLARS);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this order.");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, upsellSession, upsellPi]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/verify-purchase?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body?.purchase_id) trackPurchase(body.purchase_id, Number(body.amount));
      })
      .catch(() => undefined);
    if (upsellSession) {
      fetch(`/api/verify-purchase?session_id=${encodeURIComponent(upsellSession)}`).catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [sessionId, upsellSession]);

  if (!sessionId || error) {
    return (
      <main className="bg-slate-50 px-4 py-32 text-center">
        <p className="text-lg font-semibold text-slate-900">{error || "This page needs the checkout session from Stripe."}</p>
        <Link href="/access" className="mt-4 inline-block font-semibold text-emerald-700 underline">Get a download link</Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="bg-slate-50 px-4 py-32 text-center text-slate-600">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-700" />
        <p className="mt-3">Preparing your download…</p>
      </main>
    );
  }

  const showPitch = !order.upsellTaken;
  const creditLabel = countdownLabel(order.creditExpiresAt, now);

  return (
    <main className="bg-slate-50 px-4 pb-16 pt-28">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <CheckCircle2 className="h-12 w-12 text-emerald-700" />
          <h1 className="mt-4 text-3xl font-bold text-slate-950">Your report is ready</h1>
          <p className="mt-3 text-slate-600">
            {order.stateName && order.program ? `${order.stateName} ${order.program}. ` : ""}
            Download it here. These links last about an hour. A login link
            {order.email ? ` is also on its way to ${order.email}` : " is also on its way to the email you used at checkout"}.
          </p>
          <div className="mt-6 space-y-3">
            {files.length ? (
              files.map((file) => (
                <a
                  key={file.url}
                  href={file.url}
                  className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 font-semibold text-emerald-950 hover:bg-emerald-100"
                >
                  <span>
                    <span className="block">{file.label}</span>
                    <span className="block text-sm font-normal text-emerald-800">{file.name}</span>
                  </span>
                  <Download className="h-5 w-5 shrink-0" />
                </a>
              ))
            ) : (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                The file link is still being prepared. Use the email form and your downloads will be in the dashboard.
              </p>
            )}
          </div>
          <div className="mt-8 rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-950">Email me the login link</h2>
            <p className="mt-1 text-sm text-slate-600">Use the same email as checkout. The link opens your downloads. No password.</p>
            <AccessForm />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            You can request a fresh link anytime at <Link href="/access" className="text-emerald-700 underline">/access</Link>.
            {order.upsellTaken ? " The Launch Kit files are included." : ""}
          </p>
        </section>

        {showPitch && (
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Optional next step</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Launch Kit</h2>
            <p className="mt-2 text-slate-600">
              Add the pro forma, licensing checklist, and policy manual for this state.
              {order.creditActive
                ? ` Your ${formatUsd(MRR_CREDIT_DOLLARS)} credit makes the ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)} kit ${formatUsd(UPSELL_PRICE_DOLLARS)}.`
                : ` The report credit has ended. The kit is on its own page at ${formatUsd(LAUNCH_KIT_PRICE_DOLLARS)}.`}
            </p>
            {order.creditActive && (
              <p className="mt-3 text-sm font-semibold text-amber-800">Credit ends in {creditLabel}</p>
            )}
            {order.creditActive ? (
              <button
                type="button"
                onClick={accept}
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800 disabled:opacity-70"
              >
                {loading ? "Opening checkout…" : `Add the Launch Kit — ${formatUsd(UPSELL_PRICE_DOLLARS)}`}
              </button>
            ) : (
              <a
                href={order.launchKitUrl}
                className="mt-5 flex w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800"
              >
                View the Launch Kit
              </a>
            )}
            {payError && <p className="mt-2 text-sm text-red-700">{payError}</p>}
          </aside>
        )}
      </div>
    </main>
  );
}

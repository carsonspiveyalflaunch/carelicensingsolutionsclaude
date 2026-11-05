"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import AccessForm from "../../../access/AccessForm";
import { trackPurchase } from "@/lib/gads";
import { trackMetaPurchase } from "@/lib/meta-pixel";

type PackFile = { label: string; name: string; url: string };
type PackProgram = { program: string; assets: string[]; files: PackFile[] };
type Order = {
  amount: number;
  contentIds: string[];
  stateName: string;
  email: string | null;
  skoolUrl: string;
  programs: PackProgram[];
};

export default function StatePackThankYou() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!searchParams.has("type") && !searchParams.has("program") && !searchParams.has("p")) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("type");
    next.delete("program");
    next.delete("p");
    const qs = next.toString();
    router.replace(qs ? `/market-research/state/thank-you?${qs}` : "/market-research/state/thank-you", { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/state-pack/order?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Could not load this order.");
        return body as Order;
      })
      .then((next) => {
        if (cancelled) return;
        setOrder(next);
        trackMetaPurchase(sessionId, next.amount, next.contentIds);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this order.");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

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

  if (!sessionId || error) {
    return (
      <main className="bg-slate-50 px-4 py-32 text-center">
        <p className="text-lg font-semibold text-slate-900">{error || "This page needs the checkout session from Stripe."}</p>
        <Link href="/access" className="mt-4 inline-block font-semibold text-emerald-700 underline">
          Get a download link
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="bg-slate-50 px-4 py-32 text-center text-slate-600">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-700" />
        <p className="mt-3">Preparing your packs…</p>
      </main>
    );
  }

  const skoolUrl = order.skoolUrl;

  return (
    <main className="bg-slate-50 px-4 pb-16 pt-28">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <CheckCircle2 className="h-12 w-12 text-emerald-700" />
          <h1 className="mt-4 text-3xl font-bold text-slate-950">
            Your {order.stateName || "state"} packs are ready
          </h1>
          <p className="mt-3 text-slate-600">
            You unlocked every file in each program pack{order.stateName ? ` for ${order.stateName}` : ""}, plus Skool
            community access. Download links last about an hour. A login link
            {order.email ? ` is also on its way to ${order.email}` : " is also on its way to the email you used at checkout"}.
          </p>

          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="font-semibold text-emerald-950">Skool community access</h2>
            <p className="mt-1 text-sm text-emerald-900">
              This invite works even if a separate Skool email has not arrived yet.
            </p>
            <a
              href={skoolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-semibold text-emerald-800 underline"
            >
              Join Skool
            </a>
          </div>

          <div className="mt-8 space-y-6">
            {order.programs.length ? (
              order.programs.map((program) => (
                <section key={program.program}>
                  <h2 className="text-lg font-bold text-slate-950">{program.program}</h2>
                  <div className="mt-3 space-y-2">
                    {program.assets.map((asset) => {
                      const file = program.files.find((item) => item.label === asset);
                      return file ? (
                        <a
                          key={asset}
                          href={file.url}
                          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-950 hover:bg-emerald-100"
                        >
                          <span>
                            <span className="block">{asset}</span>
                            <span className="block text-sm font-normal text-emerald-800">{file.name}</span>
                          </span>
                          <Download className="h-5 w-5 shrink-0" />
                        </a>
                      ) : (
                        <p key={asset} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <span className="font-semibold text-slate-950">{asset}. </span>
                          Included with this pack. Use the login link if the file is still being prepared.
                        </p>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Your packs are confirmed. Use the email form and the files will be in your dashboard.
              </p>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-950">Email me the login link</h2>
            <p className="mt-1 text-sm text-slate-600">Use the same email as checkout. The link opens your downloads. No password.</p>
            <AccessForm defaultEmail={order.email || ""} />
          </div>
        </section>
      </div>
    </main>
  );
}

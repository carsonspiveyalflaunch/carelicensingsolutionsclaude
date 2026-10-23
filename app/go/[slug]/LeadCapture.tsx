"use client";

import { useState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { trackLead } from "@/lib/gads";

type Props = { slug: string; state: string; program: string; guideHref?: string };

// Soft capture for visitors who aren't ready to buy: saves them to GHL with
// this bundle's state/program so the follow-up sequence can bring them back.
export default function LeadCapture({ slug, state, program, guideHref }: Props) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, company, source: "bundle-page", slug, state, program }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong");
      trackLead("bundle-page");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left">
        <p className="flex items-center gap-2 font-semibold text-emerald-900">
          <CheckCircle2 className="h-5 w-5" /> You&apos;re on the list.
        </p>
        <p className="mt-1 text-sm text-emerald-900">
          We&apos;ll send you this {state} bundle link and follow up with what&apos;s inside.
          {guideHref ? (
            <>
              {" "}In the meantime,{" "}
              <a href={guideHref} className="font-semibold underline">read the free {state} guide</a>.
            </>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm">
      <p className="font-semibold text-slate-900">Not ready yet?</p>
      <p className="mt-1 text-sm text-slate-600">
        Leave your email and we&apos;ll send you this {state} bundle so you can come back to it.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        {/* Honeypot for bots; hidden from people. */}
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Send it to me
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export default function AccessForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/send-access-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      setMessage(body.message || "Check your inbox for your login link.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
    setState("done");
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-emerald-600 focus:outline-none"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-70"
      >
        {state === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
        Email me my login link
      </button>
      {state === "done" && <p className="text-sm text-slate-700">{message}</p>}
    </form>
  );
}

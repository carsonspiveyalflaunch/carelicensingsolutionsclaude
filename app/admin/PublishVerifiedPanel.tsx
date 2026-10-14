"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, UploadCloud } from "lucide-react";
import { adminFetch } from "@/utils/admin-fetch";

type Bundle = { slug: string; files: string[] };
type Result = { ok: boolean; message: string };

function label(slug: string) {
  return slug
    .replace(/-complete-bundle$/, "")
    .split("-")
    .map((w) => (w === "dd" ? "(DD)" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export default function PublishVerifiedPanel() {
  const [bundles, setBundles] = useState<Bundle[] | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, Result>>({});

  useEffect(() => {
    adminFetch("/api/admin/bundles/publish-verified")
      .then((r) => r.json())
      .then((b) => setBundles(b.bundles || []))
      .catch(() => setError("Could not load verified bundles."));
  }, []);

  const publish = async (slugs: string[]) => {
    setRunning(true);
    for (const slug of slugs) {
      try {
        const res = await adminFetch("/api/admin/bundles/publish-verified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const body = await res.json().catch(() => ({}));
        setResults((r) => ({
          ...r,
          [slug]: res.ok
            ? { ok: true, message: `Published ${body.uploaded?.length ?? 0} files` }
            : { ok: false, message: body.error || `Failed (${res.status})` },
        }));
      } catch (e: any) {
        setResults((r) => ({ ...r, [slug]: { ok: false, message: e?.message || "Failed" } }));
      }
    }
    setRunning(false);
  };

  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <BadgeCheck className="h-5 w-5 text-emerald-700" /> Verified bundles (2026 rebuild)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Fact-checked market research reports, P&amp;L workbooks and licensing checklists. Publishing replaces
            the older files for that bundle; the policy manual is left as is.
          </p>
        </div>
        <button
          type="button"
          disabled={running || !bundles?.length}
          onClick={() => publish((bundles || []).map((b) => b.slug))}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          Publish all ({bundles?.length ?? 0})
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {bundles === null && !error && <p className="mt-3 text-sm text-slate-500">Loading…</p>}
      {bundles && bundles.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No verified bundles are included in this deployment yet.</p>
      )}
      {bundles && bundles.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {bundles.map((b) => (
            <li key={b.slug} className="flex items-center justify-between gap-3 py-2">
              <span className="text-slate-800">{label(b.slug)}</span>
              <span className="flex items-center gap-3">
                {results[b.slug] && (
                  <span className={results[b.slug].ok ? "text-emerald-700" : "text-red-700"}>
                    {results[b.slug].message}
                  </span>
                )}
                <button
                  type="button"
                  disabled={running}
                  onClick={() => publish([b.slug])}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Publish
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

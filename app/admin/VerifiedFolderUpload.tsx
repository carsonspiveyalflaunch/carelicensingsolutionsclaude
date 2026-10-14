"use client";

import { useRef, useState } from "react";
import { FolderUp, Loader2 } from "lucide-react";
import { adminFetch } from "@/utils/admin-fetch";

// Uploads verified bundle folders straight from the admin's computer, so the paid files never
// have to be committed to the repo. Each "<slug>-complete-bundle" folder's files are stored under
// the same names publish-verified uses, replacing the older files for that bundle.
const TARGETS: { match: RegExp; label: string; type: string }[] = [
  { match: /Market Research Report\.pdf$/i, label: "market-research-report", type: "application/pdf" },
  {
    match: /Pro Forma PnL\.xlsx$/i,
    label: "pro-forma-pl-template",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  { match: /Policy and Procedure Manual\.pdf$/i, label: "policy-procedure-manual", type: "application/pdf" },
  {
    match: /Policy and Procedure Manual\.docx$/i,
    label: "policy-procedure-manual-editable",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    match: /Licensing Checklist\.xlsx$/i,
    label: "licensing-checklist",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
];

type Planned = { slug: string; files: { file: File; label: string; type: string }[] };
type Result = { ok: boolean; message: string };

function planFrom(list: FileList): Planned[] {
  const bySlug = new Map<string, Planned>();
  for (const file of Array.from(list)) {
    const parts = (file.webkitRelativePath || file.name).split("/");
    const slug = parts.slice(0, -1).reverse().find((p: string) => /^[a-z0-9-]+-complete-bundle$/.test(p));
    const target = TARGETS.find((t) => t.match.test(file.name));
    if (!slug || !target) continue;
    const entry: Planned = bySlug.get(slug) || { slug, files: [] };
    if (!entry.files.some((f) => f.label === target.label)) entry.files.push({ file, label: target.label, type: target.type });
    bySlug.set(slug, entry);
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

export default function VerifiedFolderUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<Planned[]>([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, Result>>({});

  const upload = async () => {
    setRunning(true);
    for (const b of plan) {
      const form = new FormData();
      form.append("bundleSlug", b.slug);
      for (const f of b.files) {
        form.append("files", f.file.type ? f.file : new File([f.file], f.file.name, { type: f.type }));
        form.append("labels", f.label);
      }
      try {
        const res = await adminFetch("/api/admin/bundles/upload-files", { method: "POST", body: form });
        const body = await res.json().catch(() => ({}));
        setResults((r) => ({
          ...r,
          [b.slug]: res.ok
            ? { ok: true, message: `Uploaded ${body.files?.length ?? 0} files` }
            : { ok: false, message: body.error || `Failed (${res.status})` },
        }));
      } catch (e) {
        setResults((r) => ({ ...r, [b.slug]: { ok: false, message: e instanceof Error ? e.message : "Failed" } }));
      }
    }
    setRunning(false);
  };

  const done = Object.values(results).filter((r) => r.ok).length;
  const failed = Object.values(results).filter((r) => !r.ok).length;

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <h3 className="text-sm font-semibold text-slate-900">Upload from your computer</h3>
      <p className="mt-1 text-sm text-slate-600">
        Choose the folder that holds the <code>…-complete-bundle</code> folders. Files go straight to storage and
        replace the older files for each bundle.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        aria-label="Verified bundle folder"
        // @ts-expect-error non-standard attribute for folder selection
        webkitdirectory=""
        onChange={(e) => {
          setResults({});
          setPlan(e.target.files ? planFrom(e.target.files) : []);
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={running}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          <FolderUp className="h-4 w-4" /> Choose bundles folder
        </button>
        {plan.length > 0 && (
          <button
            type="button"
            disabled={running}
            onClick={upload}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {running && <Loader2 className="h-4 w-4 animate-spin" />}
            Upload {plan.length} bundles ({plan.reduce((n, b) => n + b.files.length, 0)} files)
          </button>
        )}
        {(done > 0 || failed > 0) && (
          <span className="text-sm text-slate-700">
            {done} uploaded{failed > 0 && <span className="text-red-700"> · {failed} failed</span>}
          </span>
        )}
      </div>
      {plan.length > 0 && (
        <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-auto text-sm">
          {plan.map((b) => (
            <li key={b.slug} className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-slate-800">
                {b.slug.replace(/-complete-bundle$/, "")} <span className="text-slate-500">· {b.files.length} files</span>
              </span>
              {results[b.slug] && (
                <span className={results[b.slug].ok ? "text-emerald-700" : "text-red-700"}>{results[b.slug].message}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

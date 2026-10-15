"use client";

import { useMemo, useRef, useState } from "react";
import { FolderUp, CheckCircle2, AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { adminFetch } from "@/utils/admin-fetch";
import { programsForState } from "@/app/data/programAvailability";
import { states as SHOP_STATES } from "@/app/data/shopData";

const STATE_CODES: Record<string, string> = Object.fromEntries(SHOP_STATES.map((s) => [s.name, s.code]));
import {
  PROGRAMS,
  RESOURCE_LABEL,
  bundleSlug,
  RESOURCE_TITLE,
  STATES,
  classifyPath,
  contentTypeFor,
  planUploads,
  type PlannedUpload,
  type Resource,
} from "@/lib/bulk-import";

type Status = "idle" | "ready" | "uploading" | "done";

const CONCURRENCY = 4;
const RESOURCES: Resource[] = ["policy", "licensing", "market", "pnl"];

function fileFromInput(file: File, name: string): File {
  // Some browsers leave .xlsx with an empty MIME type; the upload route rejects those.
  const type = file.type || contentTypeFor(name);
  return file.type ? file : new File([file], file.name, { type });
}

export default function BulkImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesByPath = useRef<Map<string, File>>(new Map());
  const [plan, setPlan] = useState<PlannedUpload[]>([]);
  const [skipped, setSkipped] = useState<{ path: string; reason: string }[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [done, setDone] = useState(0);
  const [kept, setKept] = useState(0);
  const [existingFiles, setExistingFiles] = useState<Record<string, string[]>>({});
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [failed, setFailed] = useState<{ item: PlannedUpload; error: string }[]>([]);
  const [runCount, setRunCount] = useState(0);

  const coverage = useMemo(() => {
    const byBundle = new Map<string, Set<Resource>>();
    for (const p of plan) {
      const key = `${p.state}|${p.program}`;
      if (!byBundle.has(key)) byBundle.set(key, new Set());
      byBundle.get(key)!.add(p.resource);
    }
    let complete = 0;
    const gaps: { state: string; program: string; missing: string[] }[] = [];
    let total = 0;
    for (const state of STATES) {
      // Only bundles this state sells (see app/data/programAvailability.ts).
      const offered = programsForState(STATE_CODES[state]);
      for (const program of PROGRAMS.filter((p) => offered.includes(p))) {
        total += 1;
        const have = byBundle.get(`${state}|${program}`) || new Set<Resource>();
        const onSite = existingFiles[bundleSlug(state, program)] || [];
        const missing = RESOURCES.filter(
          (r) => !have.has(r) && !onSite.some((name) => name.startsWith(RESOURCE_LABEL[r])),
        );
        if (missing.length === 0) complete += 1;
        else gaps.push({ state, program, missing: missing.map((r) => RESOURCE_TITLE[r]) });
      }
    }
    return { complete, gaps, total };
  }, [plan, existingFiles]);

  const onPick = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setStatus("idle");
    setChecking(true);
    // Files already on the site (e.g. the verified 2026 rebuild) are never replaced:
    // if a bundle already has a file of a given type, the older copy is skipped.
    let existing: Record<string, string[]> = {};
    try {
      const res = await adminFetch("/api/admin/bundles/existing-files");
      if (!res.ok) throw new Error();
      existing = (await res.json()).existing || {};
    } catch {
      setChecking(false);
      setCheckError("Could not check which files are already on the site, so nothing was planned. Try again.");
      return;
    }
    setCheckError("");
    setChecking(false);
    setExistingFiles(existing);
    const map = new Map<string, File>();
    const skips: { path: string; reason: string }[] = [];
    const classified = [];
    for (const file of Array.from(list)) {
      const path = (file as any).webkitRelativePath || file.name;
      map.set(path, file);
      const c = classifyPath(path);
      if (c.targets.length === 0) skips.push({ path, reason: c.skipReason || "Not matched" });
      classified.push(c);
    }
    filesByPath.current = map;
    // Skip bundles this state doesn't sell (e.g. the P&L copy for programs a state lacks).
    const planned = planUploads(classified).filter((p) =>
      programsForState(STATE_CODES[p.state]).includes(p.program),
    );
    const alreadyThere = (p: PlannedUpload) =>
      (existing[p.bundleSlug] || []).some((name) => name.startsWith(RESOURCE_LABEL[p.resource]));
    setKept(planned.filter(alreadyThere).length);
    setPlan(planned.filter((p) => !alreadyThere(p)));
    setSkipped(skips);
    setFailed([]);
    setDone(0);
    setStatus("ready");
  };

  const uploadOne = async (item: PlannedUpload) => {
    const source = filesByPath.current.get(item.path);
    if (!source) throw new Error("File no longer available. Pick the folder again.");
    const form = new FormData();
    form.append("bundleSlug", item.bundleSlug);
    form.append("labels", item.label);
    form.append("files", fileFromInput(source, item.path));
    const res = await adminFetch("/api/admin/bundles/upload-files", { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Upload failed (${res.status})`);
    }
    const body = await res.json().catch(() => ({}));
    if (!Array.isArray(body?.files) || body.files.length === 0) {
      throw new Error("Server skipped the file (type or size not allowed)");
    }
  };

  const run = async (items: PlannedUpload[]) => {
    setStatus("uploading");
    setRunCount(items.length);
    setFailed([]);
    setDone(0);
    const queue = [...items];
    const errors: { item: PlannedUpload; error: string }[] = [];
    let completed = 0;
    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift()!;
        try {
          await uploadOne(item);
        } catch (e: any) {
          errors.push({ item, error: e?.message || "Upload failed" });
        }
        completed += 1;
        setDone(completed);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setFailed(errors);
    setStatus("done");
  };

  const total = done;
  const runTotal = runCount;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Import bundle files</h2>
        <p className="mt-2 text-sm text-slate-600">
          Pick the unzipped Care Licensing Solutions folder from Google Drive. Every policy manual,
          licensing checklist, market research report and P&amp;L template is matched to its state
          and program bundle automatically. Review the summary, then start the upload. Running it
          again replaces files instead of duplicating them.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          // @ts-expect-error: directory picking is supported by every current browser
          webkitdirectory=""
          directory=""
          onChange={(e) => onPick(e.target.files)}
        />
        <button
          type="button"
          disabled={status === "uploading" || checking}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          <FolderUp className="h-4 w-4" />
          {status === "idle" ? "Choose folder" : "Choose a different folder"}
        </button>
        {checking && <p className="mt-3 text-sm text-slate-600">Checking which files are already on the site…</p>}
        {checkError && <p className="mt-3 text-sm text-red-700">{checkError}</p>}
      </div>

      {status !== "idle" && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-emerald-50 p-4">
              <p className="text-2xl font-semibold text-emerald-900">{plan.length.toLocaleString()}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Uploads planned</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-2xl font-semibold text-slate-900">
                {coverage.complete} / {coverage.total}
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Bundles with all files</p>
            </div>
            <div className="rounded-md bg-amber-50 p-4">
              <p className="text-2xl font-semibold text-amber-900">{skipped.length.toLocaleString()}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Files skipped</p>
            </div>
          </div>
          {kept > 0 && (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{kept.toLocaleString()}</span> files left out because those bundles
              already have that file on the site (newer versions are never replaced).
            </p>
          )}

          {status === "ready" && (
            <button
              type="button"
              onClick={() => run(plan)}
              disabled={plan.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              Upload {plan.length.toLocaleString()} files
            </button>
          )}

          {(status === "uploading" || status === "done") && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                {status === "uploading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : failed.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                {status === "uploading"
                  ? `Uploading ${total.toLocaleString()} of ${runTotal.toLocaleString()}… keep this tab open`
                  : failed.length === 0
                    ? `Done. ${runTotal.toLocaleString()} files uploaded.`
                    : `Finished with ${failed.length} failed upload${failed.length === 1 ? "" : "s"}.`}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-100">
                <div
                  className="h-full bg-emerald-700 transition-all"
                  style={{ width: `${runTotal ? Math.round((total / runTotal) * 100) : 0}%` }}
                />
              </div>
              {status === "done" && failed.length > 0 && (
                <button
                  type="button"
                  onClick={() => run(failed.map((f) => f.item))}
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" /> Retry failed uploads
                </button>
              )}
            </div>
          )}

          {failed.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-slate-800">Failed uploads ({failed.length})</summary>
              <ul className="mt-2 max-h-60 overflow-auto space-y-1 text-slate-600">
                {failed.map((f, i) => (
                  <li key={i}>
                    {f.item.state} · {f.item.program} · {RESOURCE_TITLE[f.item.resource]}: {f.error}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-slate-800">
              Bundles missing a file ({coverage.gaps.length})
            </summary>
            <ul className="mt-2 max-h-60 overflow-auto space-y-1 text-slate-600">
              {coverage.gaps.map((g) => (
                <li key={`${g.state}-${g.program}`}>
                  {g.state} · {g.program}: missing {g.missing.join(", ")}
                </li>
              ))}
            </ul>
          </details>

          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-slate-800">Skipped files ({skipped.length})</summary>
            <ul className="mt-2 max-h-60 overflow-auto space-y-1 text-slate-600">
              {skipped.map((s) => (
                <li key={s.path}>
                  <span className="text-slate-800">{s.path.split("/").slice(-3).join(" / ")}</span>: {s.reason}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}

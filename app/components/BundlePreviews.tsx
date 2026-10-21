"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { previewsFor, bundleSlugFor } from "@/lib/previews";

/**
 * "Look inside" gallery of real pages from a bundle's files, with a
 * full-screen viewer. Renders nothing when the bundle has no previews.
 */
export default function BundlePreviews({
  stateName,
  program,
  productSlug,
  compact = false,
}: {
  stateName?: string;
  program?: string;
  productSlug?: string;
  compact?: boolean;
}) {
  const slug = productSlug || (stateName && program ? bundleSlugFor(stateName, program) : "");
  const previews = slug ? previewsFor(slug) : [];
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + previews.length) % previews.length)),
    [previews.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  if (!previews.length) return null;
  const name = stateName ? `${stateName} ` : "";

  return (
    <div className="text-left">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Real pages, not mockups</p>
          <p className={`${compact ? "text-lg" : "text-2xl"} mt-1 font-bold text-slate-950`}>Look inside the {name}bundle</p>
        </div>
        <p className="hidden shrink-0 text-xs text-slate-500 sm:block">Click any page to zoom</p>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 sm:gap-4"}`}>
        {previews.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:ring-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <div className={`relative overflow-hidden bg-slate-100 ${compact ? "h-36" : "h-44 sm:h-52"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={`${name}${p.label}`}
                loading="lazy"
                className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                <Eye className="h-3 w-3" /> View
              </span>
            </div>
            <p className="border-t border-slate-100 truncate px-3 py-2.5 text-xs font-semibold text-slate-800">{p.label}</p>
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label={previews[open].label}
        >
          <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
          {previews.length > 1 && (
            <>
              <button type="button" aria-label="Previous page" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6">
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button type="button" aria-label="Next page" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6">
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          <figure className="flex max-h-full max-w-3xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previews[open].src} alt={`${name}${previews[open].label}`} className="max-h-[80vh] w-auto rounded-lg bg-white shadow-2xl" />
            <figcaption className="mt-3 text-center text-sm font-medium text-white">
              {previews[open].label} <span className="text-white/60">· {open + 1} of {previews.length}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}

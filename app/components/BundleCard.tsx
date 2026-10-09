"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import type { BundleProduct } from "@/lib/bundles";
import { states } from "@/app/data/shopData";

interface BundleCardProps {
  bundle: BundleProduct;
  onAction?: () => void;
  actions?: React.ReactNode;
  footerLabel?: string;
  actionLabel?: string;
  variant?: "default" | "admin";
}

export default function BundleCard({
  bundle,
  onAction,
  actions,
  footerLabel,
  actionLabel = "See What's Included",
  variant = "default",
}: BundleCardProps) {
  const stateLabel = bundle.metadata?.state || bundle.state || bundle.name;
  const programLabel = bundle.metadata?.program || bundle.program;
  const productLabel = bundle.metadata?.productLabel || bundle.product_label;
  const code = bundle.metadata?.code || bundle.code || "";
  const year = bundle.metadata?.year || 2025;
  const isDerivedIndividual = bundle.metadata?.isDerivedIndividual || false;
  const tags = Array.isArray(bundle.metadata?.tags)
    ? bundle.metadata.tags.filter(Boolean)
    : Array.isArray(bundle.tags)
    ? bundle.tags.filter(Boolean)
    : [];
  const stateFromData = states.find(
    (s) => s.code === bundle.metadata?.code || s.code === bundle.code || s.name === bundle.metadata?.state || s.name === bundle.state,
  );
  const flagSrc = stateFromData?.flag || bundle.metadata?.flag || "/assets/images/logo-dark-bg.png";
  const logoSrc = bundle.metadata?.logo || "/assets/images/logo-dark-bg.png";
  const uniqueTags = tags.filter(
    (tag, index, arr) =>
      arr.indexOf(tag) === index &&
      tag !== stateLabel &&
      tag !== programLabel &&
      tag !== productLabel,
  );

  if (variant === "admin") {
    return (
      <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
        <div className="absolute inset-x-0 top-0 h-2 bg-emerald-600" />
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative">
                <img
                  src={flagSrc}
                  alt={stateLabel}
                  className="h-12 w-16 rounded-2xl object-cover shadow-sm"
                />
                {(bundle.metadata?.bestValue || false) && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-yellow-500 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                    Best
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700">
                  {productLabel || "Complete Bundle"}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 truncate">
                  {stateLabel}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Approved {year}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</div>
                <div className="mt-1 text-base text-slate-950">${bundle.price?.toFixed(2) ?? "0.00"}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Code</div>
                <div className="mt-1 text-base text-slate-950">{code || "—"}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</div>
                <div className="mt-1 text-base text-slate-950">{bundle.metadata?.status || "Active"}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {programLabel ? (
              <span className="rounded-full bg-emerald-700 px-3 py-1 text-[10px] font-semibold text-white">
                {programLabel}
              </span>
            ) : null}
            {productLabel ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-700">
                {productLabel}
              </span>
            ) : null}
            {uniqueTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 line-clamp-2">{bundle.name}</p>
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{bundle.description}</p>
            </div>
            <div className="hidden sm:block">
              <Image
                src={logoSrc}
                alt="bundle logo"
                className="h-14 w-14 rounded-2xl object-cover"
                width={56}
                height={56}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {footerLabel ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {footerLabel}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onAction}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <Eye size={16} />
              {actionLabel}
            </button>

            {actions && (
              <div className="flex flex-wrap gap-2">{actions}</div>
            )}
          </div>
        </div>
      </div>
  );
  }

  return (
    <div className={`relative ${isDerivedIndividual ? 'bg-[#f7ffec]' : 'bg-[#fffbea]'} border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden hover:shadow-lg transition group`}>
      <div className={`absolute inset-x-0 top-0 h-2 ${isDerivedIndividual ? 'bg-[#C1FF71]' : 'bg-yellow-400'}`} />
      <div className="p-4 pt-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2 gap-1.5">
          <div className="flex items-start gap-2">
            <img
              src={flagSrc}
              alt={bundle.metadata?.state || bundle.name}
              className="w-6 h-4 rounded shadow mt-1.5 object-cover"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-base text-gray-900 inline-block">
                {bundle.metadata?.state || bundle.name}
              </span>
              <span className="text-xs text-gray-500 inline-block">
                State Approved {bundle.metadata?.year || 2025}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold w-10 h-10 flex items-center justify-center rounded-full">
              {bundle.metadata?.code || ""}
            </span>
            {!isDerivedIndividual && (
              <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-md ml-2">
                Best Value
              </span>
            )}
            {/* {isDerivedIndividual && (
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
                Individual Resource
              </span>
            )} */}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 text-green-700 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
              Instant Download
            </span>
            <span className="flex items-center gap-1 text-gray-700 text-xs">
              <span className="w-2 h-2 bg-gray-400 rounded-full inline-block" />
              PDF Format
            </span>
          </div>

          <div>
            <Image
              src={logoSrc}
              alt="logo"
              className="w-10 h-10 rounded"
              width={40}
              height={40}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-2 mt-2">
          <span className="bg-gray-100 text-gray-700 text-[9px] px-2 py-1 rounded-full">
            {bundle.metadata?.state || bundle.name}
          </span>
          {bundle.metadata?.program ? (
            <span className="bg-green-700 text-white text-[9px] px-2 py-1 rounded-full font-semibold">
              {bundle.metadata.program}
            </span>
          ) : null}
          {bundle.metadata?.tags?.filter(
            (tag, index, arr) =>
              !!tag &&
              arr.indexOf(tag) === index &&
              tag !== bundle.metadata?.state &&
              tag !== bundle.metadata?.program &&
              tag !== bundle.metadata?.productLabel,
          ).map((tag) => (
            <span
              key={tag}
              className="bg-slate-100 text-slate-700 text-[9px] px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mb-2">
          <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 capitalize">
            {bundle.name}
          </div>
          <div className="text-gray-700 text-[10px] mb-1 line-clamp-2">
            {bundle.description}
          </div>
        </div>

        <div className="mt-auto">
          {footerLabel && (
            <div className="text-xs text-slate-500 mb-3">{footerLabel}</div>
          )}
          <button
            type="button"
            onClick={onAction}
            className="cursor-pointer w-full bg-green-800 hover:bg-green-900 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
          >
            <Eye size={16} />
            {actionLabel}
          </button>
        </div>

        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

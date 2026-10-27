"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Clock, FileText, Play, X } from "lucide-react";
import { ACADEMY_MODULES, type AcademyModule } from "@/lib/academy-curriculum";

/**
 * Expandable Operational Success Academy modules with a sample-video modal.
 * Same list the public /course curriculum uses.
 */
export default function AcademyModuleList() {
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<AcademyModule | null>(null);

  useEffect(() => {
    if (!selectedModule) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedModule(null);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedModule]);

  return (
    <>
      {ACADEMY_MODULES.map((module) => {
        const open = expandedModule === module.id;
        return (
          <div key={module.id} className="module-item">
            <div
              className={`rounded-lg border-2 transition ${
                open ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedModule(open ? null : module.id)}
                aria-expanded={open}
                className="flex w-full cursor-pointer items-start gap-4 p-4 text-left transition hover:bg-opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white sm:h-12 sm:w-12 sm:text-base">
                  {module.id}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{module.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Play size={14} />
                      {module.videos} videos
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {module.duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={14} />
                      {module.resources} resources
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-gray-600 transition ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <div className="px-4 pb-4">
                  <p className="mb-4 text-xs leading-relaxed text-gray-700 sm:text-sm">{module.description}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedModule(module)}
                    className="flex w-fit items-center gap-2 rounded-lg border-2 border-green-700 px-5 py-2.5 text-xs font-semibold text-green-700 transition hover:bg-green-700 hover:text-white sm:text-sm"
                  >
                    <Play size={16} />
                    Preview Video
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {selectedModule &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setSelectedModule(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedModule.title} preview`}
          >
            <div
              className="w-full max-w-3xl overflow-hidden rounded-lg bg-white"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b p-4 sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 sm:text-base">{selectedModule.title} - Preview</h3>
                <button
                  type="button"
                  onClick={() => setSelectedModule(null)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close preview"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={selectedModule.videoPreviewUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={`${selectedModule.title} sample video`}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

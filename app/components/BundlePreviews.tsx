import { previewsFor, bundleSlugFor } from "@/lib/previews";

/** Real page images from the selected bundle's files. Renders nothing when we have none. */
export default function BundlePreviews({ stateName, program, compact = false }: { stateName?: string; program?: string; compact?: boolean }) {
  if (!stateName || !program) return null;
  const previews = previewsFor(bundleSlugFor(stateName, program));
  if (!previews.length) return null;
  return (
    <div className="text-left">
      <p className={`${compact ? "text-base" : "text-xl"} font-bold text-gray-900`}>Look inside the {stateName} bundle</p>
      <p className="mt-1 text-xs text-gray-600 sm:text-sm">Real pages from the files you download, not mockups. Tap to enlarge.</p>
      <div className={`mt-3 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        {previews.map((p) => (
          <figure key={p.src} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <a href={p.src} target="_blank" rel="noopener noreferrer" className="block bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={`${stateName} ${p.label}`} loading="lazy" className={`${compact ? "h-32" : "h-56"} w-full object-cover object-top`} />
            </a>
            <figcaption className="border-t border-gray-100 px-3 py-2 text-xs font-medium text-gray-700 sm:text-sm">{p.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

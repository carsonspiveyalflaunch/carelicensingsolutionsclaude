import { CheckCircle2, Gift } from "lucide-react";
import { ASSET_LIST_PRICES, COURSE_PRICE_DOLLARS, COURSE_TITLE, COURSE_DETAIL, COMMUNITY_EXTRAS } from "@/lib/value-stack";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/**
 * "Everything you get" list for a complete bundle: the four files at their
 * single prices, the course bonus at its real price, and the included extras.
 * Same contents as the /go sales pages, for the regular site's bundle views.
 */
export default function BundleValueStack({
  stateName,
  price,
  compact = false,
}: {
  stateName?: string;
  price?: number;
  compact?: boolean;
}) {
  const s = stateName ? `${stateName} ` : "";
  const stack = [
    { title: `${s}Market Research Report`, detail: "", value: ASSET_LIST_PRICES.report, bonus: false },
    { title: "Pro Forma P&L (Excel)", detail: "", value: ASSET_LIST_PRICES.pnl, bonus: false },
    { title: `${s}Licensing Checklist`, detail: "", value: ASSET_LIST_PRICES.checklist, bonus: false },
    { title: "Policy & Procedure Manual (PDF + editable Word)", detail: "", value: ASSET_LIST_PRICES.manual, bonus: false },
    { title: COURSE_TITLE, detail: compact ? "11 modules, 124 lessons" : COURSE_DETAIL, value: COURSE_PRICE_DOLLARS, bonus: true },
    ...COMMUNITY_EXTRAS.map((x) => ({ title: x.title, detail: compact ? "" : x.detail, value: 0, bonus: true })),
  ];
  const total = stack.reduce((sum, x) => sum + x.value, 0);
  const pad = compact ? "px-3 py-2.5" : "px-5 py-4";

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-emerald-700 bg-white text-left">
      <div className={`bg-emerald-700 text-white ${compact ? "px-3 py-2.5" : "px-5 py-4"}`}>
        <p className={`${compact ? "text-base" : "text-xl"} font-bold`}>Everything you get</p>
        <p className="text-xs text-emerald-100 sm:text-sm">Your bundle plus the Operational Success Academy, free with your purchase.</p>
      </div>
      <ul className="divide-y divide-slate-200">
        {stack.map((x) => (
          <li key={x.title} className={`flex items-start justify-between gap-3 ${pad}`}>
            <div className="flex gap-2.5">
              {x.bonus ? <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {x.bonus && <span className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">Bonus</span>}
                  {x.title}
                </p>
                {x.detail && <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{x.detail}</p>}
              </div>
            </div>
            <p className="shrink-0 text-right text-sm font-semibold text-slate-700">
              {x.value ? money(x.value) : "Included"}
              {x.value && !compact ? <span className="block text-xs font-normal text-slate-500">sold separately</span> : null}
            </p>
          </li>
        ))}
      </ul>
      <div className={`bg-slate-50 ${pad}`}>
        <div className="flex items-baseline justify-between text-sm text-slate-700">
          <span>Total if bought separately</span>
          <span className="font-semibold line-through">{money(total)}</span>
        </div>
        {price ? (
          <div className="mt-1 flex items-baseline justify-between text-slate-950">
            <span className="font-bold">Your price</span>
            <span className={`${compact ? "text-xl" : "text-2xl"} font-bold text-emerald-800`}>{money(price)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

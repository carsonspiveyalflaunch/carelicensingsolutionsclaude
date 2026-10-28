"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Download, FileSpreadsheet, FileText, ShieldCheck } from "lucide-react";
import BuyButton from "../go/[slug]/BuyButton";
import BundleValueStack from "../components/BundleValueStack";
import { promoDeadline, promoPercent } from "@/lib/promos";
import { cleanFunnelSearch, programCodeForName, programQueryValue } from "@/lib/program-codes";
import { PAY_LATER_ENABLED, payIn4 } from "@/lib/pay-later";

export type LaunchKitProduct = {
  id: string;
  product_slug: string;
  name: string;
  price: number;
  state: string;
  code: string;
  program: string;
};

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

const INCLUDED = [
  {
    icon: FileText,
    title: "Market Research Report",
    body: "Demand, competition, reimbursement rates, and where to open, written for your state before you spend on a building or a lease.",
  },
  {
    icon: FileSpreadsheet,
    title: "Pro Forma P&L (Excel)",
    body: "Startup costs, staffing, revenue, and break-even. Change the numbers and see the profit.",
  },
  {
    icon: CheckCircle2,
    title: "Licensing Checklist",
    body: "The forms, fees, inspections, and agency steps in order, so the application is not sent back for something you missed.",
  },
  {
    icon: FileText,
    title: "Policy & Procedure Manual",
    body: "PDF plus an editable Word file written for your state's requirements. Add your agency name and you have the manual surveyors ask to see.",
  },
];

const AUDIENCE = [
  {
    title: "You already know the program",
    body: "Assisted living, home care, a group home, home health, hospice, adult day care, or another licensed care program we publish a kit for.",
  },
  {
    title: "You want the documents, ready to use",
    body: "Research, financials, the licensing checklist, and the policy manual for your state, in one download.",
  },
  {
    title: "You are ready to buy the kit",
    body: "One payment. Instant download. You do the licensing steps with the materials in hand.",
  },
];

const PROOF = [
  {
    quote: "Landed 6 clients in just 2 months, now making $38,640/month with her day program.",
    name: "Gamuchirai G.",
    role: "Community Engagement Services Agency · Virginia",
  },
  {
    quote: "Now making $73,910/month — Care Licensing Solutions helped her navigate California licensing.",
    name: "Luam M.",
    role: "Supported Living · California",
  },
  {
    quote: "Now making over $45,000/month with his group home.",
    name: "Brian S.",
    role: "Group Home Owner · California",
  },
];

function matchCode(products: LaunchKitProduct[], raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const upper = value.toUpperCase();
  if (products.some((p) => p.code === upper)) return upper;
  const byName = products.find((p) => p.state.toLowerCase() === value.toLowerCase());
  return byName?.code || "";
}

function matchProgram(products: LaunchKitProduct[], code: string, raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!code || !value) return "";
  const found = products.find((p) => p.code === code && p.program.toLowerCase() === value);
  return found?.program || "";
}

export default function LaunchKitView({ products, listPrice }: { products: LaunchKitProduct[]; listPrice: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = matchCode(products, searchParams.get("state") || "");
  const program = matchProgram(products, code, programQueryValue(searchParams));
  const product = products.find((p) => p.code === code && p.program === program) || null;

  const discountCode = (() => {
    const raw = searchParams.get("code") || "";
    return promoPercent(raw) ? raw.toUpperCase() : undefined;
  })();
  const pct = discountCode ? promoPercent(discountCode) : 0;
  const deadline = promoDeadline(discountCode);
  const price = product?.price ?? listPrice;
  const finalPrice = Math.round(price * (100 - pct)) / 100;

  const states = useMemo(() => {
    const byCode = new Map<string, string>();
    for (const item of products) byCode.set(item.code, item.state);
    return [...byCode.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const programs = useMemo(
    () => products.filter((item) => item.code === code).map((item) => item.program).sort((a, b) => a.localeCompare(b)),
    [products, code],
  );

  const replaceParams = (next: { state?: string; type?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextState = next.state ?? code;
    const offered = products.filter((item) => item.code === nextState).map((item) => item.program);
    const nextType = next.type ?? (offered.includes(program) ? program : "");
    if (nextState) params.set("state", nextState);
    else params.delete("state");
    params.delete("type");
    params.delete("program");
    const opaque = programCodeForName(nextType);
    if (opaque) params.set("p", opaque);
    else params.delete("p");
    const qs = params.toString();
    router.replace(qs ? `/launch-kit?${qs}` : "/launch-kit", { scroll: false });
  };

  const currentSearch = searchParams.toString();
  const cancelSearch = cleanFunnelSearch(currentSearch) ?? currentSearch;
  const cancelPath = cancelSearch ? `/launch-kit?${cancelSearch}` : "/launch-kit";
  const label = product
    ? pct
      ? `Get the Launch Kit for ${money(finalPrice)}`
      : `Get the Launch Kit — ${money(price)}`
    : "Get the Launch Kit";

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-emerald-950 to-slate-950 px-4 pb-16 pt-28 text-white sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Care Business Launch Kit</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
              The documents to license and launch a care business in your state
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-200">
              Market research, a pro forma P&L, the licensing checklist, and a policy manual built for your state.
              One payment of {money(listPrice)}. Download it as soon as checkout finishes.
            </p>
            <ul className="mt-8 space-y-3 text-slate-100">
              {["Instant download after payment", "Built for your state and program", "Yours to edit, print, and reuse"].map((line) => (
                <li key={line} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <PurchaseCard
            states={states}
            programs={programs}
            code={code}
            program={program}
            product={product}
            price={price}
            finalPrice={finalPrice}
            pct={pct}
            deadline={deadline}
            discountCode={discountCode}
            cancelPath={cancelPath}
            label={label}
            onState={(state) => replaceParams({ state, type: "" })}
            onProgram={(type) => replaceParams({ type })}
            hasCatalog={products.length > 0}
          />
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">Who the Launch Kit is for</h2>
          <div className="mt-6 grid gap-4">
            {AUDIENCE.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-1 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">What&apos;s included</h2>
          <p className="mt-2 text-slate-600">
            {product
              ? `${product.state} ${product.program}. The checkout line item is “${product.name}”.`
              : "Pick your state and program. The kit you check out is that state’s complete bundle from our catalog."}
          </p>
          <div className="mt-6 grid gap-4">
            {INCLUDED.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
                <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                <div>
                  <h3 className="font-semibold text-slate-950">
                    {product && item.title !== "Pro Forma P&L (Excel)" && item.title !== "Policy & Procedure Manual"
                      ? `${product.state} ${item.title}`
                      : item.title}
                  </h3>
                  <p className="mt-1 text-slate-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <BundleValueStack stateName={product?.state} price={finalPrice} />
            <div className="mt-4">
              {product ? (
                <BuyButton
                  productSlug={product.product_slug}
                  productId={product.id}
                  name={product.name}
                  price={product.price}
                  discountCode={discountCode}
                  cancelPath={cancelPath}
                  label={label}
                />
              ) : (
                <p className="text-center text-sm text-slate-500">Choose your state and program above to check out.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-slate-950">Owners who launched with these materials</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PROOF.map((item) => (
              <figure key={item.name} className="rounded-xl bg-slate-50 p-5">
                <div className="text-yellow-500" aria-hidden>★★★★★</div>
                <blockquote className="mt-3 text-sm leading-relaxed text-slate-700">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <span className="block text-slate-500">{item.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Download, t: "Instant access", d: "Download the kit right after checkout." },
              { icon: ShieldCheck, t: "State-specific", d: "Rules, rates, and agencies for the program you picked." },
              { icon: CheckCircle2, t: "Yours to keep", d: "Edit, print, and reuse for your agency." },
            ].map((item) => (
              <div key={item.t} className="rounded-xl border border-slate-200 p-5">
                <item.icon className="h-5 w-5 text-emerald-700" />
                <p className="mt-2 font-semibold text-slate-900">{item.t}</p>
                <p className="mt-1 text-sm text-slate-600">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-950">Questions</h2>
          <dl className="mt-6 space-y-4">
            {[
              ["What am I buying?", "A digital download: the research, financial template, checklist, and policy manual for the state and program you select."],
              ["When do I get the files?", "As soon as Stripe confirms payment. Your receipt links to the download page."],
              ["What does checkout charge?", product ? `${product.name} at ${money(finalPrice)}.` : `${money(listPrice)} for the complete bundle you select. The price on the Stripe page comes from our catalog.`],
              ["Can I get a refund?", "These are digital products delivered instantly. The refund terms are on the refund policy page."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-xl border border-slate-200 bg-white p-5">
                <dt className="font-semibold text-slate-950">{q}</dt>
                <dd className="mt-1 text-slate-600">{a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-slate-500">
            This kit is an informational resource. You still file with your state agency. Read the{" "}
            <a href="/refund-policy" className="font-medium text-emerald-700 underline">refund policy</a>.
          </p>
        </div>
      </section>

      <section id="buy" className="px-4 py-16">
        <div className="mx-auto max-w-md">
          <h2 className="text-center text-2xl font-bold text-slate-950">Get the Launch Kit</h2>
          <div className="mt-6">
            <PurchaseCard
              states={states}
              programs={programs}
              code={code}
              program={program}
              product={product}
              price={price}
              finalPrice={finalPrice}
              pct={pct}
              deadline={deadline}
              discountCode={discountCode}
              cancelPath={cancelPath}
              label={label}
              onState={(state) => replaceParams({ state, type: "" })}
              onProgram={(type) => replaceParams({ type })}
              hasCatalog={products.length > 0}
              light
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function PurchaseCard({
  states,
  programs,
  code,
  program,
  product,
  price,
  finalPrice,
  pct,
  deadline,
  discountCode,
  cancelPath,
  label,
  onState,
  onProgram,
  hasCatalog,
  light = false,
}: {
  states: [string, string][];
  programs: string[];
  code: string;
  program: string;
  product: LaunchKitProduct | null;
  price: number;
  finalPrice: number;
  pct: number;
  deadline: string | null;
  discountCode?: string;
  cancelPath: string;
  label: string;
  onState: (code: string) => void;
  onProgram: (program: string) => void;
  hasCatalog: boolean;
  light?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-xl sm:p-6 ${light ? "border border-slate-200 bg-white text-slate-950" : "bg-white text-slate-950"}`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">One-time payment</p>
      <p className="mt-2 text-4xl font-bold text-slate-950">
        {pct > 0 && <span className="mr-2 text-xl font-semibold text-slate-400 line-through">{money(price)}</span>}
        {money(finalPrice)}
      </p>
      {pct > 0 && (
        <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
          <Clock className="h-4 w-4" /> {pct}% off{deadline ? ` — ends ${deadline}` : " applied at checkout"}
        </p>
      )}
      <div className="mt-5 space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Your state
          <select
            value={code}
            onChange={(e) => onState(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="">Select your state</option>
            {states.map(([abbr, name]) => (
              <option key={abbr} value={abbr}>{name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Program
          <select
            value={program}
            onChange={(e) => onProgram(e.target.value)}
            disabled={!code}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">{code ? "Select a program" : "Choose a state first"}</option>
            {programs.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {product && (
        <p className="mt-3 text-sm text-slate-600">
          Stripe will show <span className="font-semibold text-slate-900">{product.name}</span>.
        </p>
      )}
      <div className="mt-4">
        {product ? (
          <BuyButton
            productSlug={product.product_slug}
            productId={product.id}
            name={product.name}
            price={product.price}
            discountCode={discountCode}
            cancelPath={cancelPath}
            label={label}
          />
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white opacity-60"
          >
            {hasCatalog ? "Choose your state and program" : "Checkout is unavailable right now"}
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-sm text-slate-500">
        {PAY_LATER_ENABLED ? "Pay in full or over time" : "One-time payment"} · Instant download · Secure checkout by Stripe
      </p>
      {PAY_LATER_ENABLED && product && (
        <p className="mt-1 text-center text-sm text-emerald-800">
          Or 4 interest-free payments of {payIn4(finalPrice)} with Afterpay. Subject to approval at checkout.
        </p>
      )}
    </div>
  );
}

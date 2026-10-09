"use client";

import React, { useEffect, useState } from "react";
import useBuyNow from "./useBuyNow";
import {
  Gift,
  Star,
  Check,
  CheckCircle2,
  X,
  Box,
  ShieldCheck,
  Loader,
} from "lucide-react";
import { BsLightning } from "react-icons/bs";
import { useToast } from "./SimpleToast";
import type { BundleProduct } from "@/lib/bundles";

interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  currentProduct: BundleProduct;
  state: string;
  stateAbbr: string;
  bundleTitle?: string;
}

export default function CompareModal({
  open,
  onClose,
  currentProduct,
  state,
  stateAbbr,
  bundleTitle,
}: CompareModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(590);
  const [completeBundle, setCompleteBundle] = useState<BundleProduct | null>(null);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const toast = useToast();
  const { buyNow, loading: buyLoading } = useBuyNow();

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(590);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  // Fetch the complete bundle for the current state
  useEffect(() => {
    if (!open) return;
    
    const currentProductAny = currentProduct as any;
    const program = currentProductAny.bundleProgram || currentProduct.metadata?.program || currentProduct.program;
    
    if (!state || !program) {
      setCompleteBundle(null);
      return;
    }

    const fetchCompleteBundle = async () => {
      setLoadingBundle(true);
      try {
        const response = await fetch(`/api/products?includeIndividual=false&includeFiles=false&state=${encodeURIComponent(state)}&program=${encodeURIComponent(program)}`);
        const data = await response.json();
        
        if (response.ok && data.products) {
          // Find the complete bundle that matches the current state AND program
          const bundle = data.products.find(
            (p: BundleProduct) =>
              p.metadata?.productLabel === 'Complete Bundle' &&
              p.metadata?.program === program &&
              p.metadata?.state === state
          );
          setCompleteBundle(bundle || null);
        }
      } catch (error) {
        console.error('Error fetching complete bundle:', error);
        setCompleteBundle(null);
      } finally {
        setLoadingBundle(false);
      }
    };

    fetchCompleteBundle();
  }, [open, currentProduct, state, stateAbbr]);

  if (!open) return null;

  const sampleName =
    currentProduct.name ||
    currentProduct.metadata?.productLabel ||
    currentProduct.type ||
    "Selected Resource";
  const samplePrice = currentProduct.price ?? 397;
  const currentProgram =
    currentProduct.metadata?.program ||
    (currentProduct as any).bundleProgram ||
    currentProduct.program ||
    "";
  const displayBundleTitle = bundleTitle || completeBundle?.name || `${state} ${currentProgram} Bundle`;
  const bundlePrice = completeBundle?.price;
  const oldPrice = completeBundle?.metadata?.oldPrice;
  const saveAmount = oldPrice && bundlePrice ? oldPrice - bundlePrice : 0;

  async function handleAddCompleteBundle() {
    if (!bundlePrice || !completeBundle) {
      toast.show('Complete bundle pricing not available');
      return;
    }
    onClose();
    buyNow({
      id: completeBundle?.product_slug || currentProduct.product_slug || `complete-bundle-${state.toLowerCase().replace(/\s+/g, "-")}`,
      name: displayBundleTitle,
      price: bundlePrice,
      type: "Complete Bundle",
      state: stateAbbr,
      quantity: 1,
    });
  }

  async function handleAddSampleOnly() {
    onClose();
    buyNow({
      id: `${currentProduct.id}-sample`,
      name: sampleName,
      price: samplePrice,
      type:
        currentProduct.type ||
        currentProduct.metadata?.productLabel ||
        "Individual Resource",
      state: stateAbbr,
      quantity: 1,
    });
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-colors">
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-2 animate-fadeIn flex flex-col"
        style={{
          maxHeight: "calc(100vh - 48px)",
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        <button
          className="absolute cursor-pointer top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-700 rounded-full bg-white bg-opacity-80 w-10 h-10 flex items-center justify-center shadow"
          onClick={onClose}
          aria-label="Close"
          style={{ zIndex: 10 }}
        >
          <X size={24} />
        </button>

        <div className="bg-green-700 text-white rounded-t-2xl px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-wide flex md:flex-row flex-col items-center gap-2">
            SPECIAL BUNDLE PRICING EXPIRES IN :
            <span className="font-mono">
              {minutes} : {seconds}
            </span>
          </span>
        </div>

        <div
          className="p-6 flex flex-col gap-4 overflow-auto"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="bg-yellow-100 text-yellow-800 font-semibold text-xs px-3 py-1 rounded-full mb-2">
              COMPLETE LICENSING SOLUTION
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-center text-green-900 leading-tight">
              Everything You Need to{" "}
              <span className="text-green-700">Launch Successfully</span>
            </h2>
            <p className="text-gray-700 text-center text-sm">
              The comparison below shows your selected sample versus the
              complete bundle for {state}.
            </p>
          </div>

          <div className="flex md:flex-row flex-col gap-4">
            <div className="md:w-1/2 w-full rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">
                Your Current Selection
              </p>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {sampleName}
              </h3>
              {/* <p className="text-sm text-slate-600 mb-6">
                {sampleName} is a preview sample for {stateName}, perfect when
                you want to verify the content before committing to the full
                launch bundle.
              </p> */}
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-green-700" />
                  <span>Sample access to {sampleName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-green-700" />
                  <span>Quick content preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <X size={18} className="text-red-500" />
                  <span>Not the full bundle</span>
                </div>
                <div className="flex items-center gap-2">
                  <X size={18} className="text-red-500" />
                  <span>No bonus materials included</span>
                </div>
              </div>
              <div className="mt-6 rounded-3xl bg-white p-4 border border-slate-200">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Sample price
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {samplePrice ? `$${samplePrice}` : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col items-center md:w-1/2 ">
              <div className="relative top-1.5 z-10 flex justify-center w-full">
                <span
                  className="flex items-center gap-1 bg-yellow-300 border border-yellow-400 text-yellow-900 font-semibold text-xs px-4 py-1 rounded-full shadow-sm"
                  style={{ boxShadow: "0 2px 8px 0 #f6e7b2" }}
                >
                  <Star size={16} className="text-yellow-900" fill="#bfa100" />
                  BEST VALUE
                </span>
              </div>
              <div
                className="w-full border border-yellow-400 rounded-2xl bg-[#fffbea] p-6 pt-2"
                style={{ boxShadow: "0 2px 16px 0 #f6e7b2" }}
              >
                <div className="flex flex-col items-center gap-2 mb-2">
                  <span className="flex items-start gap-3 pt-4 text-yellow-900 text-xl font-bold">
                    <Box size={28} className="text-yellow-900" />
                    {loadingBundle ? (
                      <div className="flex items-center gap-2">
                        <Loader size={24} className="text-green-700 animate-spin" />
                        <span className="text-base text-gray-600">Loading...</span>
                      </div>
                    ) : (
                      displayBundleTitle || `${state} ${currentProgram} Bundle`
                    )}
                  </span>
                  {loadingBundle ? (
                    <div className="flex flex-col items-center gap-3 mt-4 w-full">
                      <div className="flex items-center gap-2">
                        <div className="h-10 bg-gray-200 rounded animate-pulse" style={{width: '200px'}}></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader size={28} className="text-green-700 animate-spin" />
                        <span className="text-sm text-gray-600">Fetching pricing...</span>
                      </div>
                    </div>
                  ) : bundlePrice !== undefined ? (
                    <>
                      <div className="flex items-center gap-3">
                        {oldPrice !== undefined && (
                          <span className="text-gray-400 text-lg line-through">
                            ${oldPrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-green-800">
                          {bundlePrice ? `$${bundlePrice.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                      {saveAmount > 0 && oldPrice !== undefined && (
                        <span className="bg-green-600 text-white font-bold px-4 py-1 rounded-full text-sm mt-2">
                          SAVE ${saveAmount.toFixed(2)} ({Math.round((saveAmount / oldPrice) * 100)}% OFF)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm mt-2">Pricing unavailable</span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <div className="font-bold text-gray-900 mb-2">
                      What's Included:
                    </div>
                    <ul className="flex flex-col gap-2">
                      <li className="flex items-start text-green-900 text-sm">
                        <CheckCircle2
                          size={16}
                          className="text-green-600 mr-2 mt-0.5 shrink-0"
                        />
                        Market Research Report
                      </li>
                      <li className="flex items-start text-green-900 text-sm">
                        <CheckCircle2
                          size={16}
                          className="text-green-600 mr-2 mt-0.5 shrink-0"
                        />
                        Policy & Procedure Manual
                      </li>
                      <li className="flex items-start text-green-900 text-sm">
                        <CheckCircle2
                          size={16}
                          className="text-green-600 mr-2 mt-0.5 shrink-0"
                        />
                        Pro Forma P&L Template
                      </li>
                      <li className="flex items-start text-green-900 text-sm">
                        <CheckCircle2
                          size={16}
                          className="text-green-600 mr-2 mt-0.5 shrink-0"
                        />
                        Licensing Checklist
                      </li>
                      <li className="flex items-start text-green-900 text-sm">
                        <CheckCircle2
                          size={16}
                          className="text-green-600 mr-2 mt-0.5 shrink-0"
                        />
                        11-Module Operational Success Course
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-2">
                      FREE Bonuses:
                    </div>
                    <ul className="flex flex-col gap-2">
                      <li className="flex items-center text-yellow-900 text-sm">
                        <Gift size={16} className="mr-2 text-yellow-900" />
                        Private Community Access
                      </li>
                      <li className="flex items-center text-yellow-900 text-sm">
                        <Gift size={16} className="mr-2 text-yellow-900" />
                        Free Updates When Laws Change
                      </li>
                    </ul>
                    <div className="mt-4 bg-yellow-200 rounded-lg px-3 py-2 text-yellow-900 text-sm font-semibold flex flex-col items-center gap-2">
                      <div>
                        <BsLightning
                          size={16}
                          className="text-yellow-900 inline"
                        />
                        Course at{" "}
                        <span className="font-bold text-yellow-800">
                          HALF PRICE
                        </span>
                      </div>
                      <span>
                        $697 →{" "}
                        <span className="text-green-700 font-bold">$397</span>{" "}
                        <span className="text-xs text-gray-500">
                          (Save $300!)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-2 px-4 flex flex-col gap-3">
          <button
            className="w-full bg-yellow-400 cursor-pointer hover:bg-yellow-500 disabled:bg-yellow-200 disabled:cursor-not-allowed text-green-900 font-bold py-3 rounded-lg mt-2 text-lg transition flex items-center justify-center gap-2"
            onClick={handleAddCompleteBundle}
            disabled={loadingBundle || !bundlePrice}
          >
            {loadingBundle ? (
              <>
                <Loader size={20} className="text-green-700 animate-spin" />
                <span>Loading pricing...</span>
              </>
            ) : (
              `Upgrade to Complete Bundle - ${bundlePrice ? `$${bundlePrice.toFixed(2)}` : 'N/A'}`
            )}
          </button>
          <p className="text-xs text-gray-500 text-center">
            {saveAmount > 0 && oldPrice ? `Save ${Math.round((saveAmount / oldPrice) * 100)}%` : ''} - This offer expires when the timer hits zero
          </p>
          {/* <button
            onClick={handleAddSampleOnly}
            aria-label="Keep sample"
            className="text-gray-400 hover:text-gray-700 cursor-pointer text-xs mx-auto block mt-2"
          >
            No thanks, I’ll just get {sampleName} for ${samplePrice}
          </button> */}
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-600">
            <span>
              <Check size={12} className="text-green-600 mr-1 inline" /> Instant
              Digital Download
            </span>
            <span>
              <Check size={12} className="text-green-600 mr-1 inline" />{" "}
              Lifetime Access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

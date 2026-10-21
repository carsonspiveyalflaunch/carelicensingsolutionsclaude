"use client";

import React, { useEffect, useState } from "react";
import useBuyNow from "./useBuyNow";
import BundleValueStack from "./BundleValueStack";
import BundlePreviews from "./BundlePreviews";
import {
  Gift,
  BadgePercent,
  Star,
  CheckCircle2,
  X,
  Check,
  Box,
  Loader,
} from "lucide-react";
import { BsLightning } from "react-icons/bs";

interface BundleModalProps {
  open: boolean;
  onClose: () => void;
  state: string;
  stateAbbr?: string;
  program: string;
  bundleTitle?: string;
  productSlug?: string;
  price?: number;
  oldPrice?: number;
  saveAmount?: number;
  items?: { label: string; price: number }[];
  bonuses?: string[];
  coursePrice?: number;
}

export default function BundleModal({
  open,
  onClose,
  state,
  stateAbbr,
  program,
  bundleTitle: propBundleTitle,
  productSlug,
  price: propPrice,
  oldPrice: propOldPrice,
  saveAmount: propSaveAmount,
  items: propItems,
  bonuses: propBonuses,
  coursePrice: propCoursePrice,
}: BundleModalProps) {
  const [completeBundle, setCompleteBundle] = useState<any | null>(null);
  const [loadingBundle, setLoadingBundle] = useState(false);
  // Countdown timer state (9:50)
  const [secondsLeft, setSecondsLeft] = useState(590); // 9*60 + 50 = 590 seconds

  // Fetch complete bundle data from database
  useEffect(() => {
    if (!open || !state || !program) return;

    const fetchCompleteBundle = async () => {
      setLoadingBundle(true);
      try {
        const response = await fetch(`/api/products?includeIndividual=false&includeFiles=false&state=${encodeURIComponent(state)}&program=${encodeURIComponent(program)}`);
        const data = await response.json();
        
        if (response.ok && data.products) {
          // Find the complete bundle that matches the current state AND program
          const bundle = data.products.find(
            (p: any) =>
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
  }, [open, state, program]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    setSecondsLeft(590);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  // Use fetched data or fallback to props (only after loading completes)
  const bundleTitle = propBundleTitle || completeBundle?.name || `${state} ${program} Bundle`;
  const price = completeBundle?.price ?? (loadingBundle ? undefined : propPrice);
  const oldPrice = completeBundle?.metadata?.oldPrice ?? (loadingBundle ? undefined : propOldPrice);
  const saveAmount = oldPrice && price ? oldPrice - price : 0;
  const items = propItems || [
    { label: 'Market Research Report', price: 0 },
    { label: 'Policy & Procedure Manual', price: 0 },
    { label: 'Pro Forma P&L Template', price: 0 },
    { label: 'Licensing Checklist', price: 0 },
  ];
  const bonuses = propBonuses || ['Private Community Access', 'Free Updates When Laws Change'];
  const coursePrice = completeBundle?.metadata?.coursePrice ?? (loadingBundle ? undefined : propCoursePrice);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const { buyNow, loading: buyLoading } = useBuyNow();

  async function handleAddToCart() {
    // Direct purchase flow: start Stripe checkout for this single bundle
    onClose();
    buyNow({
      id: completeBundle?.product_slug || productSlug || `bundle-${bundleTitle}`,
      name: bundleTitle,
      price,
      type: "Bundle",
      state: stateAbbr || state,
      quantity: 1,
    });
  }

  if (!open) return null;
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
        {/* Close Button */}
        <button
          className="absolute cursor-pointer top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-700 rounded-full bg-white bg-opacity-80 w-10 h-10 flex items-center justify-center shadow"
          onClick={onClose}
          aria-label="Close"
          style={{ zIndex: 10 }}
        >
          <X size={24} />
        </button>
        {/* Header */}
        <div className="bg-green-700 text-white rounded-t-2xl px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-wide flex md:flex-row flex-col items-center gap-2">
            INSTANT DIGITAL DOWNLOAD · LIFETIME ACCESS
          </span>
        </div>
        {/* Content */}
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
              The complete package for {bundleTitle}
            </p>
          </div>
          {/* Best Value Section - Styled to match image */}
          <div className="w-full flex flex-col items-center">
            {/* Badge */}
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
                <span className="flex items-center gap-3 pt-4 text-yellow-900 text-xl font-bold">
                  <Box size={28} className="text-yellow-900" />
                  {loadingBundle ? (
                    <div className="flex items-center gap-2">
                      <Loader size={24} className="text-green-700 animate-spin" />
                      <span className="text-base text-gray-600">Loading...</span>
                    </div>
                  ) : (
                    bundleTitle || `${state} ${program} Bundle`
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
                ) : price !== undefined ? (
                  <>
                    <div className="flex items-center gap-3">
                      {oldPrice !== undefined && (
                        <span className="text-gray-400 text-lg line-through">
                          ${oldPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-4xl font-bold text-green-800">
                        {price ? `$${price.toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    {saveAmount > 0 && oldPrice !== undefined ? (
                      <span className="bg-green-600 text-white font-bold px-4 py-1 rounded-full text-sm mt-2">
                        SAVE ${saveAmount.toFixed(2)} (56% OFF)
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-gray-500 text-sm mt-2">Pricing unavailable</span>
                )}
              </div>
              <div className="mt-4">
                <BundleValueStack compact stateName={state} price={price} />
              </div>
              <div className="mt-4">
                <BundlePreviews compact stateName={state} program={program} />
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            className="w-full bg-yellow-400 cursor-pointer hover:bg-yellow-500 disabled:bg-yellow-200 disabled:cursor-not-allowed text-green-900 font-bold py-3 rounded-lg mt-2 text-lg transition flex items-center justify-center gap-2"
            onClick={handleAddToCart}
            disabled={buyLoading || loadingBundle || !price}
          >
            {buyLoading || loadingBundle ? (
              <>
                <Loader size={20} className="text-green-700 animate-spin" />
                <span>{buyLoading ? 'Processing…' : 'Loading pricing...'}</span>
              </>
            ) : (
              `Buy Now - ${price ? `$${price.toFixed(2)}` : 'N/A'}`
            )}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Instant access after checkout. Download everything from your dashboard.
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 cursor-pointer text-xs mx-auto block mt-2"
          >
            Maybe later
          </button>
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-600">
            <span>
              <Check size={12} className="text-green-600 mr-1 inline" /> Instant
              Digital Download
            </span>
            <span>
              <Check size={12} className="text-green-600 mr-1 inline" /> Instant
              Download
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

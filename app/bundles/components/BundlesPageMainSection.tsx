"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Clock, CheckCircle, Gift, Settings, Package, Star, BookOpen, ShoppingCart, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "../../components/cart-context";
import useBuyNow from "../../components/useBuyNow";

const stateNames: { [abbr: string]: string } = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

const programTypes = [
  "Home Health Agencies",
  "Nursing Facilities",
  "Assisted Living Facilities",
  "Group Homes for Children",
  "Adult Day Care Programs",
  "Child Care Facilities",
  "Residential Care (Developmental Disabilities)",
  "Home Care Organizations (Non-Medical)",
];

export default function BundlesPageMainSection() {
  const router = useRouter();
  const { addItem } = useCart();
  const { buyNow, loading: buyLoading } = useBuyNow();
  const [selectedState, setSelectedState] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 10,
    seconds: 0,
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        if (hours === 0 && minutes === 0 && seconds === 0) {
          clearInterval(timer);
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              clearInterval(timer);
              return { hours: 0, minutes: 0, seconds: 0 };
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleContinue = async () => {
    if (selectedState && selectedType) {
      await buyNow({
        id: `bundle-${selectedState}-${selectedType}`,
        name: `Complete State Licensing Bundle - ${selectedType}`,
        price: 997,
        type: selectedType,
        state: selectedState,
        quantity: 1,
      });
    }
  };

  return (
    <>
      {/* Countdown Banner */}
      <div className="w-full bg-green-700 text-white pb-4 pt-20 text-center text-sm font-semibold flex items-center justify-center gap-3">
        <Clock size={20} className="shrink-0" />
        <span>SPECIAL BUNDLE PRICING EXPIRES IN:</span>
        <div className="flex items-center gap-1 font-mono text-lg">
          <span className="bg-green-800 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span>:</span>
          <span className="bg-green-800 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-700 font-semibold text-xs px-4 py-1.5 rounded-full mb-4">
              <Check size={14} className="shrink-0" /> COMPLETE LICENSING SOLUTION
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Everything You Need to{" "}
              <span className="text-yellow-600">Launch Successfully</span>
            </h1>
            <p className="text-gray-600 text-lg">
              The complete package for your care business
            </p>
          </div>

          {/* Configuration Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={20} className="text-gray-700 shrink-0" />
              <h2 className="text-xl font-bold text-gray-900">
                Customize Your Launch Kit
              </h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Select your state and program type to get started
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* State Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  1. Your State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
                >
                  <option value="">Select Your State</option>
                  {Object.entries(stateNames).map(([abbr, name]) => (
                    <option key={abbr} value={abbr}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Type Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  2. Program Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={!selectedState}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700 ${
                    !selectedState
                      ? "border-gray-200 opacity-50 cursor-not-allowed"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">
                    {selectedState
                      ? "Select a program type"
                      : "Select a state first"}
                  </option>
                  {programTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
            {/* Best Value Badge - Top Right */}
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1 bg-yellow-300 text-yellow-900 font-bold text-xs px-4 py-1 rounded-full">
                <Star size={14} fill="currentColor" className="shrink-0" /> BEST VALUE
              </span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Package size={24} className="text-gray-700 shrink-0" />
              <h3 className="text-2xl font-bold text-gray-900">
                Complete State Licensing Bundle
              </h3>
            </div>

            {/* Price Section - Stacked Layout */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <span className="text-sm text-gray-500 line-through">$2,285</span>
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-3">$997</div>
              <span className="inline-block bg-yellow-400 text-yellow-900 font-bold text-xs px-4 py-1.5 rounded-full">
                SAVE $1288 (56% OFF)
              </span>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-yellow-200 mb-6"></div>

            {/* Two Column Content */}
            <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-yellow-200">
              {/* Left Column - What's Included */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-sm">What's Included:</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="flex items-start gap-2">
                      <Check size={18} className="text-green-700 shrink-0 mt-0.5" />
                      <span className="text-gray-800 text-sm font-medium">
                        Market Research Report
                      </span>
                    </span>
                    <span className="text-gray-600 font-semibold text-sm ml-2">$397</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="flex items-start gap-2">
                      <Check size={18} className="text-green-700 shrink-0 mt-0.5" />
                      <span className="text-gray-800 text-sm font-medium">
                        Policy & Procedure Manual
                      </span>
                    </span>
                    <span className="text-gray-600 font-semibold text-sm ml-2">$497</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="flex items-start gap-2">
                      <Check size={18} className="text-green-700 shrink-0 mt-0.5" />
                      <span className="text-gray-800 text-sm font-medium">
                        Pro Forma P&L Template
                      </span>
                    </span>
                    <span className="text-gray-600 font-semibold text-sm ml-2">$297</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="flex items-start gap-2">
                      <Check size={18} className="text-green-700 shrink-0 mt-0.5" />
                      <span className="text-gray-800 text-sm font-medium">Licensing Checklist</span>
                    </span>
                    <span className="text-gray-600 font-semibold text-sm ml-2">$397</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Free Bonuses */}
              <div>
                <h4 className="inline-flex items-center gap-1 font-bold text-gray-900 mb-4 text-sm">
                  <Gift size={16} className="text-green-700 shrink-0" /> FREE Bonuses:
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check size={18} className="text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-800 text-sm font-medium">
                      Private Community Access
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={18} className="text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-800 text-sm font-medium">
                      Free Updates When Laws Change
                    </span>
                  </div>

                  {/* Course Highlight Box */}
                  <div className="bg-white border-2 border-green-300 rounded-lg p-3 mt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen size={16} className="text-green-700 shrink-0" />
                          <span className="font-bold text-gray-900 text-sm">Course at HALF PRICE</span>
                        </div>
                        <div className="text-xs text-gray-700">
                          <span className="line-through text-gray-400">$697</span>
                          <span className="ml-2">→</span>
                          <span className="ml-2 font-bold text-green-700">$297</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">Save $400</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add-on Section - Course at Bottom */}
            <div className="flex justify-between items-center mb-8 pb-8 border-b-2 border-yellow-200">
              <p className="text-sm text-gray-800 font-medium">
                11-Module Operational Success Course
              </p>
              <div className="text-right">
                <span className="line-through text-gray-400 text-sm mr-2">$697</span>
                <span className="font-bold text-green-700">$297</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="space-y-4">
              <button
                onClick={handleContinue}
                disabled={!selectedState || !selectedType}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition inline-flex items-center justify-center gap-2 ${
                  selectedState && selectedType
                    ? "bg-yellow-500 hover:bg-yellow-600 text-gray-900 cursor-pointer"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed opacity-60"
                }`}
              >
                <ShoppingCart size={18} className="shrink-0" /> Add to Cart & Continue
              </button>
              <p className="text-center text-xs text-gray-600">
                Please select your state and program type above
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

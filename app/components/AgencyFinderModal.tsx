"use client";

import React, { useState } from "react";
import { X, Wand2, ChevronRight } from "lucide-react";

interface AgencyFinderModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AgencyFinderModal({
  open,
  onClose,
}: AgencyFinderModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-colors"
    >
      <div
        className="relative bg-[#174a3c] rounded-2xl shadow-2xl max-w-2xl w-full mx-2 animate-fadeIn flex flex-col"
        style={{
          maxHeight: "calc(100vh - 48px)",
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        {/* Close Button */}
        <button
          className="absolute cursor-pointer top-3 right-3 text-gray-300 hover:text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-700 rounded-full bg-[#174a3c] bg-opacity-80 w-10 h-10 flex items-center justify-center shadow"
          onClick={onClose}
          aria-label="Close"
          style={{ zIndex: 10 }}
        >
          <X size={24} />
        </button>
        {/* Header Badge */}
        <div className="flex justify-center mt-8 mb-4">
          <span className="flex items-center gap-2 bg-[#e6d98c] text-[#174a3c] font-semibold text-sm px-4 py-1 rounded-full shadow-sm">
            <Wand2 size={18} className="text-[#174a3c]" />
            Free Interactive Tool
          </span>
        </div>
        {/* Content */}
        <div className="px-8 pb-8 pt-2 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-2 leading-tight">
            Find Your Perfect
            <br />
            <span className="text-[#e6d98c]">Care Business Model</span>
          </h2>
          <p className="text-white text-center md:text-base text-sm mb-6 max-w-xl">
            Compare startup costs, regulations, and profit potential across 10
            care agency types. Discover which model fits your background,
            budget, and goals.
          </p>
          {/* Form */}
          <form className="w-full max-w-md flex flex-col gap-4 mb-4">
            <div>
              <label className="block text-start text-[#e6d98c] text-sm font-semibold mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-[#e6d98c] bg-[#174a3c] text-white py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#e6d98c]"
              />
            </div>
            <div>
              <label className="block text-start text-[#e6d98c] text-sm font-semibold mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-[#e6d98c] bg-[#174a3c] text-white py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#e6d98c]"
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer w-full bg-[#e6d98c] hover:bg-[#ffe066] text-[#174a3c] font-bold py-3 rounded-lg mt-2 text-base transition flex items-center justify-center gap-2"
            >
              Unlock the Agency Finder <ChevronRight size={16} />
            </button>
          </form>
          <p className="text-white/80 text-xs text-center mb-6">
            No spam. Unsubscribe anytime.
          </p>
          {/* Footer Stats */}
          <div className="hidden md:flex justify-center gap-12 mt-2 mb-2">
            <div className="flex flex-col items-center">
              <span className="text-[#e6d98c] text-2xl font-bold">10</span>
              <span className="text-white/80 text-sm">Agency Types</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[#e6d98c] text-2xl font-bold">5</span>
              <span className="text-white/80 text-sm">Owner Profiles</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[#e6d98c] text-2xl font-bold">3</span>
              <span className="text-white/80 text-sm">Quick Questions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

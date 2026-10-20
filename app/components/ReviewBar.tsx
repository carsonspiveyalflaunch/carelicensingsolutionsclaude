"use client";

import { Star } from "lucide-react";

export default function ReviewBar() {
  return (
    <div className="w-full bg-[#E9ECEA] border-b border-gray-200">
      <div className="max-w-7xl mx-auto py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm md:text-base px-6">
        {/* Left Text */}
        <p className="text-gray-700 font-medium text-center sm:text-left">
          Trusted by facility owners in all{" "}
          <span className="font-semibold text-[#2F5D46]">50 states</span>
        </p>

        {/* Right Review Section */}
        <div className="flex items-center gap-2 text-gray-700">
          <Star size={16} fill="#C9A441" stroke="#C9A441" />
          <span className="font-medium">Instant download · Lifetime access</span>
        </div>
      </div>
    </div>
  );
}

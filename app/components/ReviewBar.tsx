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
        <div className="flex items-center gap-3">
          {/* Stars */}
          <div className="flex items-center gap-1 text-[#C9A441]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="#C9A441" stroke="#C9A441" />
            ))}
          </div>

          {/* Rating */}
          <span className="font-semibold text-gray-800">4.9/5</span>

          {/* Reviews */}
          <span className="text-gray-600">from 847 reviews</span>
        </div>
      </div>
    </div>
  );
}

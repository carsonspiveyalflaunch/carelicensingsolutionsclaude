"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
const AgencyFinderModal = dynamic(() => import("./AgencyFinderModal"), {
  ssr: false,
});

export default function ShopPageBanner() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="bg-green-800 text-white pb-16 pt-28 min-h-[300px]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-4 px-4">
          <div>
            <h1
              ref={headingRef}
              className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
            >
              Shop Licensing Packages
            </h1>
            <p
              ref={subheadingRef}
              className="text-sm sm:text-base mb-6 max-w-lg"
            >
              Browse our complete collection of state-specific compliance
              resources.
            </p>
          </div>
          <div>
            <button
              ref={buttonRef}
              onClick={() => setModalOpen(true)}
              className="bg-yellow-500 cursor-pointer hover:bg-yellow-400 text-green-900 font-semibold px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              Not sure what to search for?
            </button>
          </div>
        </div>
      </section>
      <AgencyFinderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

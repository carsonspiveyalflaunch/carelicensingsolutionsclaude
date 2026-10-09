"use client";

import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

export default function AboutPageHero() {
  const badgeRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const tl = gsap.timeline({ defaults: { duration: 1, ease: "power3.out" } });
    tl.from(badgeRef.current, { y: 40, opacity: 0 })
      .from(headingRef.current, { y: 50, opacity: 0 }, "-=0.5")
      .from(subheadingRef.current, { y: 50, opacity: 0 }, "-=0.5");
  }, []);

  return (
    <section
      className="relative bg-[#417a5a] py-20 md:py-28 text-center text-white"
      style={{ minHeight: 220 }}
    >
      {/* subtle pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.08] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:22px_22px]" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center">
        <span className="bg-[#b6ff7a] text-[#417a5a] font-semibold text-sm px-5 py-2 rounded-full mb-6 mt-2 shadow">
          About Us
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Empowering Care Business Entrepreneurs
        </h1>
        <p className="md:text-lg text-base text-white/90 max-w-2xl mx-auto">
          We've helped over 500 care business owners navigate the complex world
          of healthcare licensing with confidence.
        </p>
      </div>
    </section>
  );
}

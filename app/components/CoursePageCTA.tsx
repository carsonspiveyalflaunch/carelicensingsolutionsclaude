"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function CoursePageCTA() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top 80%",
        },
        defaults: { ease: "power3.out" },
      });

      tl.fromTo(
        ".cta-title",
        { autoAlpha: 0, y: 50 },
        { autoAlpha: 1, y: 0, duration: 1 },
      )
        .fromTo(
          ".cta-sub",
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.9 },
          "-=0.6",
        )
        .fromTo(
          ".cta-buttons > *",
          { autoAlpha: 0, y: 25 },
          { autoAlpha: 1, y: 0, stagger: 0.15, duration: 0.7 },
          "-=0.5",
        )
        .fromTo(
          ".cta-card",
          { autoAlpha: 0, y: 60, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 1 },
          "-=0.4",
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-[#2f6a4f] py-12 text-center text-white"
    >
      {/* subtle pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:22px_22px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <h2 className="cta-title text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
          Ready to Master Care Business Operations?
        </h2>

        <p className="cta-sub mt-5 text-base text-white/80 max-w-2xl mx-auto">
          Join hundreds of successful care business owners who transformed their
          businesses with our proven framework.
        </p>

        <div className="cta-buttons mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/shop"
            className="group bg-[#f0b23a] hover:bg-[#e3a62f] text-[#1c3b2b] font-semibold px-7 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              Shop Now
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                size={15}
              />
            </span>
          </a>
          <a
            href="/bundles"
            className="group bg-transparent hover:bg-[#e3a62f] hover:text-[#1c3b2b] text-white font-semibold px-7 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] border border-white/40"
          >
            <span className="flex items-center gap-2">
              Get Course + Bundle - Save 56%
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                size={15}
              />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

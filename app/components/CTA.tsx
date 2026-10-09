"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
const AgencyFinderModal = dynamic(() => import("./AgencyFinderModal"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const root = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
          Ready to Launch Your Care Business?
        </h2>

        <p className="cta-sub mt-5 text-base text-white/80 max-w-2xl mx-auto">
          Join 500+ care business owners who trusted Care Licensing Solutions to
          navigate licensing with confidence.
        </p>

        <div className="cta-buttons mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/shop" className="group bg-[#f0b23a] hover:bg-[#e3a62f] text-[#1c3b2b] font-semibold px-7 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]">
            <span className="flex items-center gap-2">
              Browse Packages
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                size={15}
              />
            </span>
          </a>

          <a href="/bundles" className="border border-white/40 hover:border-white text-white px-7 py-3 rounded-xl font-medium transition-all duration-300 hover:bg-white/10 active:scale-[0.98]">
            Compare Bundles
          </a>
        </div>

        {/* bottom card */}
        <div className="cta-card mt-14 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-7 md:p-10 max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex md:flex-row flex-col items-center gap-4">
              <div className="w-9 h-9 rounded-full border border-[#f0b23a] flex items-center justify-center text-[#f0b23a]">
                <Navigation size={15} />
              </div>

              <h3 className="text-lg md:text-xl font-semibold">
                Not Sure Which Care Agency Type Is Right For You?
              </h3>
            </div>

            <p className="text-white/80 max-w-xl">
              Compare 10 care agency types based on your capital, background,
              and goals.
            </p>

            <button
              className="group mt-2 cursor-pointer bg-[#f0b23a] hover:bg-[#e3a62f] text-[#1c3b2b] font-semibold px-7 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
              onClick={() => setModalOpen(true)}
            >
              <span className="flex items-center gap-2">
                Launch Agency Finder
                <ArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  size={15}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* Agency Finder Modal */}
      <AgencyFinderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}

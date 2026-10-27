"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DocumentFeatureGrid } from "./DocumentFeatureCard";

gsap.registerPlugin(ScrollTrigger);

export default function BundleFeatures() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".bundle-card");

      gsap.fromTo(
        cards,
        { y: 60, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="overflow-hidden bg-neutral-100 px-6 py-6 md:px-0 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 md:text-4xl">What&apos;s Included in the Bundle</h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
            Each asset is crafted for your specific state and program type — no generic templates, no guesswork.
          </p>
        </div>

        <DocumentFeatureGrid />

        <div className="mt-16 text-center">
          <p className="mb-6 text-neutral-600">Ready to get started with your state-specific package?</p>
          <a
            href="/shop"
            className="rounded-lg bg-[#2F5D46] px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#254A38]"
          >
            View Packages
          </a>
        </div>
      </div>
    </section>
  );
}

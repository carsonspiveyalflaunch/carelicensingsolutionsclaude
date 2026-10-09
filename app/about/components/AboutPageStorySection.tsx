"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AboutPageStorySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Animate heading
    const heading = sectionRef.current.querySelector("h2");
    if (heading) {
      gsap.fromTo(
        heading,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: heading,
            start: "top 80%",
            markers: false,
          },
        }
      );
    }

    // Animate card
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: 0.2,
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 75%",
            markers: false,
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-gradient-to-b from-white to-gray-50 py-12 md:py-16 lg:py-20 px-4 md:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-8 md:mb-12">
          Why We Built Care Licensing Solutions
        </h2>

        {/* Story Card */}
        <div
          ref={cardRef}
          className="bg-white rounded-lg p-6 md:p-8 lg:p-10 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          {/* First Paragraph */}
          <p className="text-gray-700 text-sm md:text-base lg:text-lg leading-relaxed mb-5 md:mb-6">
            After spending years in healthcare administration, we saw a consistent pattern: passionate entrepreneurs
            with great ideas for care businesses getting stuck in the licensing process. They would spend months
            researching regulations, hire expensive consultants, or worse—give up entirely.
          </p>

          {/* Second Paragraph */}
          <p className="text-gray-700 text-sm md:text-base lg:text-lg leading-relaxed mb-5 md:mb-6">
            We knew there had to be a better way. So we took our combined decades of experience in healthcare licensing,
            policy development, and care business operations and created the resource we wished existed when we started.
          </p>

          {/* Third Paragraph */}
          <p className="text-gray-700 text-sm md:text-base lg:text-lg leading-relaxed">
            Today, Care Licensing Solutions provides state-specific, audit-ready documentation that helps entrepreneurs
            skip months of research and launch their care businesses with confidence. Every policy, every checklist,
            every template is crafted by experts who understand what surveyors are looking for.
          </p>
        </div>
      </div>
    </section>
  );
}

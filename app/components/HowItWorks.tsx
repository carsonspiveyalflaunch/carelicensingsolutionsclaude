"use client";

import { useEffect, useRef } from "react";
import { MapPin, Building2, Package, Download } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Select Your State",
    description:
      "Choose from our coverage of all 50 states with state-specific requirements.",
    icon: MapPin,
  },
  {
    number: "02",
    title: "Choose Your Program Type",
    description:
      "Pick from 11 program types to get tailored compliance documentation.",
    icon: Building2,
  },
  {
    number: "03",
    title: "Pick Your Products",
    description: "Choose individual assets or the complete Launch Kit bundle.",
    icon: Package,
  },
  {
    number: "04",
    title: "Download & Launch",
    description:
      "Instant access to all materials. Start your care business journey today.",
    icon: Download,
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Main timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      // Heading animation
      tl.from(".how-heading", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Timeline line animation
      tl.from(
        ".timeline-line",
        {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1,
          ease: "power2.out",
        },
        "-=0.5",
      );

      // Cards animation
      tl.from(
        ".how-card",
        {
          y: 60,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
        },
        "-=0.7",
      );

      // Number badge pop
      tl.from(
        ".step-number",
        {
          scale: 0,
          opacity: 0,
          duration: 0.5,
          stagger: 0.2,
          ease: "back.out(1.7)",
        },
        "-=0.8",
      );

      // Floating animation loop (subtle)
      gsap.to(".floating-icon", {
        y: -8,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-white py-12 md:px-0 px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto text-center">
        {/* Heading */}
        <h2 className="how-heading text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-4">
          How It Works
        </h2>
        <p className="how-heading md:text-base text-sm text-gray-600 max-w-2xl mx-auto mb-16">
          Four simple steps to get your care business license-ready.
        </p>

        {/* Timeline line (desktop only) */}
        <div className="relative">
          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-14 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="how-card relative flex flex-col items-center text-center"
                >
                  {/* Icon Circle */}
                  <div className="relative mb-6">
                    <div className="floating-icon w-24 h-24 md:w-28 md:h-28 bg-[#2F5D46] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(47,93,70,0.4)]">
                      <Icon size={32} className="text-white" />
                    </div>

                    {/* Number Badge */}
                    <div className="step-number absolute -top-2 -right-2 bg-[#C9A441] text-black font-semibold text-sm w-10 h-10 rounded-full flex items-center justify-center shadow">
                      {step.number}
                    </div>
                  </div>
                  {/* Divider line (desktop only) */}
                  {index !== steps.length - 1 && (
                    <div className="hidden lg:block absolute -z-[1] top-12 right-[-50%] w-full h-[1px] bg-gray-300"></div>
                  )}
                  {/* Text */}
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

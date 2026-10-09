"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";
import { gsap } from "gsap";
import ImageBanner from "../../public/assets/images/homepage/hero-bg.jpg"

const HeroSection = () => {
  const heroRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const staggerRefs = useRef<HTMLAnchorElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Left Content Animation
      gsap.from(leftRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power3.out",
      });

      // Buttons & badges stagger
      gsap.fromTo(
        staggerRefs.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          delay: 0.5,
          ease: "power2.out",
        },
      );

      // Right Glass Card Fade In
      gsap.from(rightRef.current, {
        opacity: 0,
        y: 60,
        duration: 1,
        delay: 0.4,
        ease: "power3.out",
      });

      // Glass Card Items Stagger
      gsap.from(itemsRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.2,
        delay: 0.8,
        ease: "power2.out",
      });

      // Subtle floating animation
      gsap.to(rightRef.current, {
        y: -8,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative w-full min-h-screen  pt-6 flex items-center overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${ImageBanner.src})` }}
      />
      <div className="absolute inset-0 bg-[#1f4d3a]/90" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* LEFT SIDE */}
        <div ref={leftRef} className="text-white text-center lg:text-left">
          <div className="stagger-item inline-block bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full text-xs sm:text-sm mb-6">
            Trusted by 500+ Care Business Owners
          </div>

          <h1 className="stagger-item text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            Everything You Need
            to Launch a{" "}
            <span className="text-yellow-400">Licensed Care Business</span>
          </h1>

          <p className="stagger-item text-base text-gray-200 mb-8 max-w-xl mx-auto lg:mx-0">
            State-specific licensing packages, compliance-ready policies, and
            proven operational frameworks trusted by care business owners
            nationwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
            <a
              href="/states"
              ref={(el) => {
                if (el) staggerRefs.current[0] = el;
              }}
              className="stagger-item flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg shadow-lg transition"
            >
              Find Your Package
              <ArrowRight size={18} />
            </a>

            <a
              href="/shop"
              ref={(el) => {
                if (el) staggerRefs.current[1] = el;
              }}
              className="stagger-item flex items-center justify-center border border-white/40 text-white px-6 py-3 rounded-lg backdrop-blur-sm hover:bg-white/10 transition"
            >
              Browse All Products
            </a>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-200">
            <div className="stagger-item flex items-center gap-2">
              <ShieldCheck size={18} className="text-yellow-400" />
              50-State Coverage
            </div>

            <div className="stagger-item flex items-center gap-2">
              <ShieldCheck size={18} className="text-yellow-400" />
              Compliance-Ready
            </div>

            <div className="stagger-item flex items-center gap-2">
              <ShieldCheck size={18} className="text-yellow-400" />
              Expert-Crafted
            </div>

            <div className="stagger-item flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Instant Download
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div ref={rightRef} className="w-full">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            {[
              {
                icon: <BarChart3 className="text-yellow-400" size={26} />,
                title: "Market Research Report",
                desc: "50+ Pages, Data-Driven Insights",
              },
              {
                icon: <FileText className="text-yellow-400" size={26} />,
                title: "Complete Policy Manual",
                desc: "150+ Pages, State-Specific",
              },
              {
                icon: <ShieldCheck className="text-yellow-400" size={26} />,
                title: "Licensing Checklist",
                desc: "Step-by-Step Guidance",
              },
              {
                icon: <Zap className="text-yellow-400" size={26} />,
                title: "Pro Forma Templates",
                desc: "Financial Planning Made Easy",
              },
            ].map((item, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) itemsRef.current[i] = el;
                }}
                className="flex items-start gap-4 bg-white/10 p-4 rounded-xl"
              >
                {item.icon}
                <div>
                  <h4 className="font-semibold text-white text-sm sm:text-base">
                    {item.title}
                  </h4>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

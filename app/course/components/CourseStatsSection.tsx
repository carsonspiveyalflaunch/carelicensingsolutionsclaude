"use client";
import React, { useEffect, useRef } from "react";
import { Play, Clock, FileText, Infinity, Box, Download } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    icon: Play,
    headline: "115+",
    label: "Video Lessons",
    color: "text-green-700",
  },
  {
    icon: Clock,
    headline: "50+",
    label: "Hours of Content",
    color: "text-green-700",
  },
  {
    icon: FileText,
    headline: "100+",
    label: "Resources & Templates",
    color: "text-green-700",
  },
  {
    icon: Download,
    headline: "∞",
    label: "Lifetime Access",
    color: "text-green-700",
  },
  {
    icon: Box,
    headline: "56%",
    label: "Bundle Savings",
    color: "text-green-700",
  },
];

export default function CourseStatsSection() {
  const sectionRef = useRef(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        itemsRef.current,
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                ref={(el) => {
                  if (el) itemsRef.current[idx] = el;
                }}
                className="flex flex-col items-center text-center "
              >
                <Icon className={`${stat.color} mb-2`} size={32} />
                <h3 className="text-2xl font-bold text-gray-900">{stat.headline}</h3>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

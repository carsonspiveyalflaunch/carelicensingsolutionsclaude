"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  ClipboardList,
  HeartPulse,
  Sun,
  HandHeart,
  Baby,
  Users,
  Activity,
  Heart,
  Shield,
  ArrowRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { programCards } from "../data/shopData";

// we keep icons inline since shopData doesn't need them
const programs: { title: string; slug: string; icon: any }[] = [
  { title: "Assisted Living Facilities", slug: programCards.find(p => p.title === "Assisted Living Facilities")?.slug || "", icon: Home },
  { title: "Nursing Facilities (SNF)", slug: programCards.find(p => p.title === "Nursing Facilities (SNF)")?.slug || "", icon: ClipboardList },
  { title: "Home Health Agencies", slug: programCards.find(p => p.title === "Home Health Agencies")?.slug || "", icon: HeartPulse },
  { title: "Adult Day Care Programs", slug: programCards.find(p => p.title === "Adult Day Care Programs")?.slug || "", icon: Sun },
  { title: "Hospice Programs", slug: programCards.find(p => p.title === "Hospice Programs")?.slug || "", icon: HandHeart },
  { title: "Child Care Facilities", slug: programCards.find(p => p.title === "Child Care Facilities")?.slug || "", icon: Baby },
  { title: "Group Homes for Children", slug: programCards.find(p => p.title === "Group Homes for Children")?.slug || "", icon: Users },
  { title: "Personal Home Care", slug: programCards.find(p => p.title === "Personal Home Care")?.slug || "", icon: Activity },
  { title: "Residential Care (DD)", slug: programCards.find(p => p.title === "Residential Care (DD)")?.slug || "", icon: Heart },
  { title: "Residential Treatment (Children)", slug: programCards.find(p => p.title === "Residential Treatment (Children)")?.slug || "", icon: Shield },
];

export default function ProgramTypes() {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".program-card");

      // Heading
      gsap.fromTo(
        ".program-heading",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".program-heading",
            start: "top 85%",
          },
        },
      );

      // Cards staggered properly
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15, // 👈 controls one-by-one speed
          scrollTrigger: {
            trigger: cards[0], // trigger from first card
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );

      // Floating animation
      gsap.to(".program-icon", {
        y: -6,
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
    <section ref={sectionRef} className="bg-[#F3F4F3] py-12 md:px-0 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center">
        {/* Heading */}
        <h2 className="program-heading text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-4">
          Find Your Program Type
        </h2>

        <p className="program-heading text-sm md:text-base text-gray-600 max-w-3xl mx-auto mb-16">
          Comprehensive licensing packages tailored for every type of care
          business.
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {programs.map((program, index) => {
            const Icon = program.icon;

            return (
              <div
                key={index}
                className="program-card bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group cursor-pointer"
                onClick={() => router.push(`/shop?programs=${program.slug}`)}
              >
                {/* Icon */}
                <div className="program-icon w-20 h-20 bg-[#E6ECE8] rounded-full flex items-center justify-center mb-6">
                  <Icon size={28} className="text-[#2F5D46]" />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-[#2C2C2C] mb-4 leading-snug">
                  {program.title}
                </h3>

                {/* Arrow */}
                <ArrowRight
                  size={18}
                  className="text-gray-400 group-hover:text-[#2F5D46] transition-colors duration-300"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

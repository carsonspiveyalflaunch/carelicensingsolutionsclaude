"use client";
import React, { useEffect, useRef } from "react";
import {
  CheckSquare,
  DollarSign,
  Building2,
  Shield,
  Calculator,
  Users,
  User,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CourseCommunitySection = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const membersRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Badge & Heading animation
      gsap.fromTo(
        ".community-header",
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        },
      );

      // Cards stagger animation
      gsap.fromTo(
        cardsRef.current,
        {
          opacity: 0,
          y: 40,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.4,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        },
      );

      // Members section animation
      gsap.fromTo(
        membersRef.current,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        },
      );

      // Hover effect on cards
      cardsRef.current.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { y: -8, duration: 0.3, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { y: 0, duration: 0.3, ease: "power2.out" });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const professionals = [
    {
      icon: CheckSquare,
      title: "Licensed Professionals",
      desc: "Network with operators who've successfully navigated licensing in your state",
      color: "text-black",
    },
    {
      icon: DollarSign,
      title: "Specialty Lenders",
      desc: "Connect with lenders who specialize in care facility financing",
      color: "text-black",
    },
    {
      icon: Building2,
      title: "Real Estate Brokers",
      desc: "Work with brokers experienced in care facility properties",
      color: "text-black",
    },
    {
      icon: Shield,
      title: "Insurance Brokers",
      desc: "Get proper coverage from specialists who understand care business risks",
      color: "text-black",
    },
    {
      icon: Calculator,
      title: "Tax Planners & Advisors",
      desc: "Optimize your structure with tax pros who know the industry",
      color: "text-black",
    },
    {
      icon: Users,
      title: "HR & Bookkeeping",
      desc: "Access bookkeepers and HR consultants familiar with care facilities",
      color: "text-black",
    },
  ];

  return (
    <section ref={sectionRef} className="relative w-full py-16 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20 space-y-4 sm:space-y-6">
          <div className="community-header">
            <span className="inline-block bg-black text-green-300 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full">
              EXCLUSIVE COMMUNITY
            </span>
          </div>

          <h2 className="community-header text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            More Than a Course — A Professional Network
          </h2>

          <p className="community-header text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            When you join, you gain access to our exclusive network of
            already-licensed professionals and trusted industry partners ready
            to support your journey.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20">
          {professionals.map((professional, idx) => {
            const IconComponent = professional.icon;
            return (
              <div
                key={idx}
                ref={(el) => {
                  if (el) cardsRef.current[idx] = el;
                }}
                className="bg-white border border-green-200 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className={`${professional.color} mb-4 gap-3 flex items-center`}>
                  <span className="p-2 bg-green-100 rounded-full">
                    <IconComponent size={24} />
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {professional.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-gray-600">
                  {professional.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Members Section */}
        <div
          ref={membersRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left"
        >
          <div className="flex -space-x-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 border-2 border-white flex items-center justify-center"
              >
                <User size={16} className="text-black" />
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-bold text-gray-900">100+ members</span>{" "}
            <span className="text-gray-600">
              actively helping each other succeed
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CourseCommunitySection;

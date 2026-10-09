"use client";
import React, { useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const missionValues = [
  {
    title: "Compliance First",
    description: "Every document we create is designed to meet or exceed state regulatory requirements.",
    icon: CheckCircle,
  },
  {
    title: "Entrepreneur Focused",
    description: "We understand the challenges of starting a care business and build our resources accordingly.",
    icon: CheckCircle,
  },
  {
    title: "Continuous Improvement",
    description: "We constantly update our materials to reflect the latest regulatory changes.",
    icon: CheckCircle,
  },
  {
    title: "Accessible Expertise",
    description: "We make professional-grade compliance resources available to everyone.",
    icon: CheckCircle,
  },
];

export default function AboutPageMissionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

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

    // Animate description paragraph
    const description = sectionRef.current.querySelector("p");
    if (description) {
      gsap.fromTo(
        description,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.2,
          scrollTrigger: {
            trigger: description,
            start: "top 80%",
            markers: false,
          },
        }
      );
    }

    // Animate cards with stagger
    const cards = cardsRef.current.filter((card) => card !== null);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          markers: false,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-gradient-to-b from-gray-50 to-white py-12 md:py-16 lg:py-20 px-4 md:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-6">
          Our Mission
        </h2>

        {/* Description */}
        <p className="text-center text-gray-700 text-sm md:text-base max-w-4xl mx-auto mb-12 md:mb-16 leading-relaxed">
          At Care Licensing Solutions, we believe that starting a care business shouldn't require months of research or a
          team of consultants. Our mission is to democratize access to professional-grade licensing resources, making it
          possible for passionate entrepreneurs to launch compliant care businesses that serve their communities.
        </p>

        {/* Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
          {missionValues.map((value, idx) => {
            const IconComponent = value.icon;
            return (
              <div
                key={idx}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className="bg-white rounded-lg p-6 md:p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start gap-4">
                  <IconComponent
                    size={28}
                    className="text-green-700 shrink-0 mt-1 md:w-8 md:h-8"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-base md:text-lg text-black mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

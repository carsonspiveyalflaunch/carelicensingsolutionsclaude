"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: "What's included in the licensing packages?",
    a: "Our packages include state-specific policy and procedure manuals, licensing checklists, pro forma P&L templates, market research reports, and operational guides.",
  },
  {
    q: "Do you cover my state?",
    a: "Yes. We provide coverage for all U.S. states with up-to-date licensing requirements and documentation tailored to your region.",
  },
  {
    q: "How quickly can I access the materials?",
    a: "Immediately after purchase, you will receive secure access to your dashboard where all materials can be downloaded and reviewed anytime.",
  },
  {
    q: "What if my state updates its licensing requirements after I purchase?",
    a: "We monitor regulatory changes and provide updated templates and checklists when requirements change so your documents stay compliant.",
  },
  {
    q: "Can I use these documents for multiple locations?",
    a: "Licenses are typically valid per location. We offer discounted multi-location packages if you plan to open multiple branches.",
  },
];

export default function FAQ() {
  const [active, setActive] = useState<number | null>(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".faq-title", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });

      gsap.from(".faq-item", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const toggleFAQ = (index: number) => {
    const isOpen = active === index;
    const content = contentRefs.current[index];
    if (!content) return;

    if (isOpen) {
      // Close
      gsap.to(content, {
        height: 0,
        duration: 0.4,
        ease: "power2.inOut",
      });
      setActive(null);
    } else {
      // Open
      gsap.to(content, {
        height: content.scrollHeight,
        duration: 0.4,
        ease: "power2.inOut",
      });
      setActive(index);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#F3F4F3] py-16 md:px-0 px-6 overflow-hidden"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 faq-title">
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-gray-500 text-sm sm:text-base">
            Everything you need to know about getting started.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((item, index) => {
            const isOpen = active === index;
            return (
              <div
                key={index}
                className="faq-item bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-gray-900 font-medium text-sm sm:text-base">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`transition-transform duration-300 text-black ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    size={20}
                  />
                </button>

                <div
                  ref={el => { contentRefs.current[index] = el; }}
                  className="px-6 overflow-hidden"
                  style={{ height: isOpen ? "auto" : 0 }}
                >
                  <p className="pb-5 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

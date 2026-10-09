"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const testimonials = [
  {
    name: "Gamuchirai G.",
    role: "Community Engagement Services Agency • Virginia",
    quote:
      "Landed 6 clients in just 2 months, now making $38,640/month with her day program — Care Licensing Solutions helped her navigate Virginia DBHDS licensing with confidence.",
    amount: "$38,640/mo",
    loom: "https://www.loom.com/embed/ad790c8419b54ad7b923562818a9a205?hide_owner=true&hide_title=true&hide_share=true",
  },
  {
    name: "Luam M.",
    role: "Supported Living for the Developmentally Disabled • California",
    quote:
      "Now making $73,910/month — Care Licensing Solutions helped her navigate California Department of Developmental Services licensing with ease.",
    amount: "$73,910/mo",
    loom: "https://www.loom.com/embed/cfd77f378d384ccead7d1498315e9eb4?hide_owner=true&hide_title=true&hide_share=true",
  },
  {
    name: "Brian S.",
    role: "Group Home Owner • California",
    quote:
      "Now making over $45,000/month with his group home — Care Licensing Solutions helped him navigate California licensing and launch with confidence.",
    amount: "$45,000+/mo",
    loom: "https://www.loom.com/embed/9d5cdf735cca4e40850460f85aaf1070?hide_owner=true&hide_title=true&hide_share=true",
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Testimonials mounted");

    gsap.registerPlugin(ScrollTrigger);

    const cards = gsap.utils.toArray(".testimonial-card");

    // ensure visible first
    gsap.set(cards, { opacity: 1, y: 0 });

    const anim = gsap.from(cards, {
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    ScrollTrigger.refresh();

    return () => {
      anim.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="bg-white py-12 overflow-hidden md:px-0 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            What Care Business Owners Are Saying
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Real success stories from entrepreneurs who launched with Care
            Licensing Solutions.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="testimonial-card relative bg-[#2f5d4622] rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 flex flex-col"
            >
              <div className="relative rounded-xl overflow-hidden border mb-4 aspect-video">
                <iframe
                  src={t.loom}
                  className="w-full h-full"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <span className="absolute -top-3 right-4 bg-[#2F5D46] text-white text-xs px-3 py-1 rounded-full shadow">
                {t.amount}
              </span>
              <div className="mb-3 text-yellow-500">⭐⭐⭐⭐⭐</div>

              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                “{t.quote}”
              </p>

              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full shrink-0 bg-white flex items-center justify-center font-semibold text-gray-700">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-700">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

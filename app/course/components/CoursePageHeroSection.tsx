"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";
import { gsap } from "gsap";
import Swal from "sweetalert2";
import { useAuth } from "@/app/components/AuthContext";
import { useCart } from "@/app/components/cart-context";

const CoursePageHeroSection = () => {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const heroRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const staggerRefs = useRef<HTMLAnchorElement[]>([]);

  const handleEnrollClick = () => {
    // Add course to cart
    const courseItem = {
      id: "course-operational-success-academy",
      name: "Care Licensing Solutions Operational Success Academy",
      price: 697,
      type: "course",
      product_slug: "course-operational-success-academy",
      metadata: {
        course_type: "operational-success-academy",
        enrollment_type: "course",
        description: "Complete 11-module video training system for care business licensing and operations",
      },
    };
    
    addItem(courseItem);
    
    // Navigate to main checkout page
    router.push("/checkout");
  };

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
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-[#1f4d3a]/90" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* LEFT SIDE */}
        <div ref={leftRef} className="text-white text-center lg:text-left">
          <div className="stagger-item inline-block bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full text-xs sm:text-sm mb-6">
            Complete Video Training
          </div>

          <h1 className="stagger-item text-3xl sm:text-4xl md:text-[44px] font-extrabold leading-tight mb-6">
            Care Licensing Solutions{" "}
            <span className="text-yellow-400">Operational Success Academy</span>
          </h1>

          <p className="stagger-item text-base text-gray-200 mb-8 max-w-xl mx-auto lg:mx-0">
            The complete 11-module system to launch and scale your care business
            with confidence. Learn from industry experts who've helped hundreds
            of businesses succeed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
            <button
              onClick={handleEnrollClick}
              className="stagger-item cursor-pointer flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg shadow-lg transition"
            >
              Enroll Now - $697
              <ArrowRight size={18} />
            </button>

            <a
              href="#lessons"
              ref={(el) => {
                if (el) staggerRefs.current[1] = el;
              }}
              className="stagger-item flex items-center justify-center border border-white/40 text-white px-6 py-3 rounded-lg backdrop-blur-sm hover:bg-white/10 transition"
            >
              Preview Free Lessons
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Stars */}
            <div className="flex items-center gap-1 text-[#ffcd42]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#ffcd42" stroke="#ffcd42" />
              ))}
            </div>

            {/* Rating */}
            <span className="font-semibold text-white">4.9/5</span>

            {/* Reviews */}
            <span className="text-gray-200">from 847 reviews</span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div ref={rightRef} className="w-full flex justify-center">
          <div className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden shadow-xl">
            <iframe
              src="https://www.loom.com/embed/501b407b711f429e9c08b6b7f1f70e34"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
              title="Course Introduction"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoursePageHeroSection;

"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Play,
  FileText,
  BarChart3,
  ClipboardList,
  LineChart,
  LucideIcon,
  BoxIcon,
  Check,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AcademyModuleList from "../../components/AcademyModuleList";

gsap.registerPlugin(ScrollTrigger);

interface CardProps {
  title: string;
  subtitle: string;
  fileType: string;
  fileMeta: string;
  items?: string[];
  highlightBox?: boolean;
  icon: LucideIcon;
}

function FeatureCard({
  title,
  subtitle,
  fileType,
  fileMeta,
  items,
  highlightBox,
  icon: Icon,
}: CardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bundle-card bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="border-t-4 border-[#2F5D46]" />

      <div className="p-6">
        <div className="flex gap-4 items-start">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0">
            <Icon className="text-white" size={22} />
          </div>

          {/* Title */}
          <div>
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            <p className="text-sm text-neutral-500 italic mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="text-xs text-neutral-500 mt-4">
          {fileType} · {fileMeta}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="bg-[#F3F4F3] hover:bg-[#E6ECE8] rounded-md py-2 px-3 cursor-pointer flex items-center justify-between w-full mt-4 text-sm font-medium text-neutral-800"
        >
          <span>{open ? "Hide details" : "See what's inside"}</span>
          <ChevronDown
            className={`transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
            size={16}
          />
        </button>

        <div
          className={`grid transition-all duration-500 ${
            open
              ? "grid-rows-[1fr] opacity-100 mt-4"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            {items && (
              <ul className="space-y-2 text-sm text-neutral-700">
                {items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-lime-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {highlightBox && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-neutral-700">
                <strong>Why it Matters</strong>
                <p className="mt-2">
                  This isn't a generic industry overview—it's state-specific,
                  program-specific intelligence with reimbursement rates and
                  regulatory citations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseCurriculumSection() {
  const sectionRef = useRef(null);
  const listRef = useRef(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("curriculum");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".curriculum-header",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        },
      );

      gsap.fromTo(
        ".curriculum-tabs",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          delay: 0.2,
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        },
      );

      gsap.fromTo(
        ".module-item",
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.05,
          duration: 0.4,
          delay: 0.3,
          scrollTrigger: { trigger: listRef.current, start: "top 85%" },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="lessons" className="relative w-full py-16 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="curriculum-header inline-block bg-black text-green-300 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full">
            11 MODULES
          </span>
          <h2 className="curriculum-header text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-2">
            Course Curriculum
          </h2>
          <p className="curriculum-header text-sm sm:text-base text-gray-600">
            From concept to operational facility
          </p>
        </div>

        {/* Tabs */}
        <div className="curriculum-tabs bg-gray-100 flex justify-center mb-8 w-max mx-auto rounded-full">
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`cursor-pointer px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold rounded-full transition flex items-center gap-2 ${
              activeTab === "curriculum"
                ? "bg-green-100 text-gray-900 border-2 border-gray-200"
                : "bg-gray-100 text-gray-700 border-2 border-transparent"
            }`}
          >
            <Play size={18} />
            Curriculum
          </button>
          <button
            onClick={() => setActiveTab("what-you-get")}
            className={`cursor-pointer px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold rounded-full transition flex items-center gap-2 relative ${
              activeTab === "what-you-get"
                ? "bg-green-100 text-gray-900 border-2 border-gray-200"
                : "bg-gray-100 text-gray-700 border-2 border-transparent"
            }`}
          >
            <BoxIcon size={18} />
            What You Get
            <span className="absolute -top-2 -right-2 bg-green-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
              Save 56%
            </span>
          </button>
        </div>

        {activeTab === "curriculum" && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  11
                </div>
                <div className="text-xs text-gray-600">Modules</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  150+
                </div>
                <div className="text-xs text-gray-600">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  50+
                </div>
                <div className="text-xs text-gray-600">Videos</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  100+
                </div>
                <div className="text-xs text-gray-600">Resources</div>
              </div>
            </div>

            <div ref={listRef} className="space-y-3">
              <AcademyModuleList />
            </div>
          </>
        )}

        {activeTab === "what-you-get" && (
          <div className="space-y-8">
            {/* Bundle Banner */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
              <div className="flex items-start gap-6 mb-6">
                {/* Icon */}
                <div className="w-12 h-12 bg-green-300 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BoxIcon className="text-green-900" size={24} />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    Bundle & Save 56%
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Get everything included with the Enterprise Bundle
                  </p>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-800">
                    <span className="text-green-700 p-1.5 bg-gray-200 rounded-full">
                      <Check size={18} className="text-green-700" />
                    </span>
                    <span className="font-medium text-sm">
                      Full 11-Module Video Course
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800">
                    <span className="text-green-700 p-1.5 bg-gray-200 rounded-full">
                      <Check size={18} className="text-green-700" />
                    </span>
                    <span className="font-medium text-sm">
                      Complete Policy & Procedure Manual{" "}
                      <span className="text-gray-600">($497 value)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800">
                    <span className="text-green-700 p-1.5 bg-gray-200 rounded-full">
                      <Check size={18} className="text-green-700" />
                    </span>
                    <span className="font-medium text-sm">
                      Licensing Documentation Checklist{" "}
                      <span className="text-gray-600">($397 value)</span>
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-800">
                    <span className="text-green-700 p-1.5 bg-gray-200 rounded-full">
                      <Check size={18} className="text-green-700" />
                    </span>
                    <span className="font-medium text-sm">
                      Market Research Report{" "}
                      <span className="text-gray-600">($397 value)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800">
                    <span className="text-green-700 p-1.5 bg-gray-200 rounded-full">
                      <Check size={18} className="text-green-700" />
                    </span>
                    <span className="font-medium text-sm">
                      Professional Network & Community Access
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800">
                    <span className="text-green-700 p-1.5 bg-gray-200 rounded-full">
                      <Check size={18} className="text-green-700" />
                    </span>
                    <span className="font-medium text-sm">
                      Free Updates When Laws Change
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer with Price and CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-green-200">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-900">$997</div>
                  <div className="flex items-center gap-2">
                    <span className="text-base text-gray-400 line-through">
                      $2,285 value
                    </span>
                    <span className="bg-green-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                      Save 56%
                    </span>
                  </div>
                </div>
                <a href="/bundles" className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-3 rounded-xl transition">
                  View Bundle Details
                </a>
              </div>
            </div>

            {/* Grid */}
            <div className="grid gap-8 md:grid-cols-2">
              <FeatureCard
                title="Market Research Report"
                subtitle="Know your market before you invest a dollar."
                fileType="PDF"
                fileMeta="50–60 Pages"
                icon={BarChart3}
                items={[
                  "Executive Summary with key indicators",
                  "Licensed Facilities overview",
                  "Startup feasibility analysis",
                  "Financial 5-Year Forecast",
                  "Market & Systems Landscape",
                  "Strategic Recommendations",
                ]}
                highlightBox
              />

              <FeatureCard
                title="Licensing Documentation Checklist"
                subtitle="Never miss a requirement."
                fileType="Excel"
                fileMeta="15+ line items"
                icon={ClipboardList}
                items={[
                  "Application Requirements",
                  "Entity Registration",
                  "Compliance Review",
                  "Inspection Prep",
                ]}
              />

              <FeatureCard
                title="Submission-Ready Policy & Procedure Manual"
                subtitle="Policies regulators expect to see."
                fileType="Word Doc"
                fileMeta="Fully Editable"
                icon={FileText}
                items={[
                  "HR Policies",
                  "Clinical Procedures",
                  "Risk Management Protocols",
                ]}
              />

              <FeatureCard
                title="Pro Forma Profit & Loss Template"
                subtitle="See your financial runway before launch."
                fileType="Excel"
                fileMeta="12-Month Projection"
                icon={LineChart}
                items={[
                  "Revenue Forecast",
                  "Expense Breakdown",
                  "Cash Flow Projection",
                ]}
              />
            </div>

            {/* CTA */}
            <div className="text-center mt-16">
              <p className="text-neutral-600 mb-6">
                Ready to get started with your state-specific package?
              </p>

              <a
                href="/shop"
                className="inline-block bg-[#2F5D46] hover:bg-[#254A38] text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-300"
              >
                View Packages
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

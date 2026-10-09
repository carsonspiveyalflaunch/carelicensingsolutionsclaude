"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Play,
  Clock,
  FileText,
  Home,
  X,
  BarChart3,
  ClipboardList,
  LineChart,
  LucideIcon,
  BoxIcon,
  Check,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

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

interface Module {
  id: number;
  title: string;
  videos: number;
  duration: number;
  resources: number;
  description: string;
  videoPreviewUrl: string;
}

const modules: Module[] = [
  {
    id: 1,
    title: "Introduction to the Industry",
    videos: 17,
    duration: 170,
    resources: 12,
    description:
      "Understand the industry landscape, regulations, and opportunities.",
    videoPreviewUrl: "https://www.youtube.com/embed/vaOVMgo4bS0",
  },
  {
    id: 2,
    title: "Business Entity Formation",
    videos: 12,
    duration: 120,
    resources: 10,
    description: "Learn the best business structures for your care facility.",
    videoPreviewUrl: "https://www.loom.com/embed/b042a7334ed34c7d8882545f3a7820fa",
  },
  {
    id: 3,
    title: "Finding Your Administrator",
    videos: 8,
    duration: 100,
    resources: 9,
    description: "Discover how to hire and onboard the right leadership.",
    videoPreviewUrl: "https://www.loom.com/embed/2e5442a02fb1480ebe20d702fba81b9e",
  },
  {
    id: 4,
    title: "Financing Your Facility",
    videos: 9,
    duration: 90,
    resources: 7,
    description: "Explore funding options and financial planning strategies.",
    videoPreviewUrl: "https://www.loom.com/embed/4cf6bbf737a94c1abf7d7df860dc6d4b",
  },
  {
    id: 5,
    title: "Facility Acquisition",
    videos: 10,
    duration: 130,
    resources: 8,
    description: "Navigate property selection and acquisition processes.",
    videoPreviewUrl: "https://www.loom.com/embed/96d4c3adf9d24df3b2034bbb444607ce",
  },
  {
    id: 6,
    title: "Licensing & Vendification",
    videos: 9,
    duration: 100,
    resources: 14,
    description: "Complete guide to licensing requirements and applications.",
    videoPreviewUrl: "https://www.loom.com/embed/90f11bdacbab42359d447dc20dcfb0f5",
  },
  {
    id: 7,
    title: "Insurance & Risk Mitigation",
    videos: 7,
    duration: 100,
    resources: 10,
    description: "Protect your business with proper insurance coverage.",
    videoPreviewUrl: "https://www.youtube.com/embed/O-acpAJLkME",
  },
  {
    id: 8,
    title: "Staff Hiring & Onboarding",
    videos: 10,
    duration: 100,
    resources: 11,
    description: "Build and train your care team from the ground up.",
    videoPreviewUrl: "https://www.loom.com/embed/104fb7b33c1f42f8802dbddce374fded",
  },
  {
    id: 9,
    title: "Client Intake",
    videos: 7,
    duration: 70,
    resources: 9,
    description: "Master the admission and assessment process.",
    videoPreviewUrl: "https://www.loom.com/embed/ffbe0df972ad4f9e8e3c58e2a31cd545",
  },
  {
    id: 10,
    title: "Marketing & Census Building",
    videos: 10,
    duration: 100,
    resources: 11,
    description: "Grow your client base through effective marketing.",
    videoPreviewUrl: "https://www.youtube.com/embed/BpbFNYr8R80",
  },
  {
    id: 11,
    title: "Systems & Daily Operations",
    videos: 8,
    duration: 100,
    resources: 15,
    description: "Establish systems for smooth daily operations.",
    videoPreviewUrl: "https://www.loom.com/embed/5823755ca08144de9b187ee93b46f252",
  },
];

export default function CourseCurriculumSection() {
  const sectionRef = useRef(null);
  const listRef = useRef(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("curriculum");
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

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

  const toggleModule = (id: number) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  const openPreview = (module: Module) => {
    setSelectedModule(module);
    setShowVideoModal(true);
  };

  const totalVideos = modules.reduce((sum, m) => sum + m.videos, 0);
  const totalDuration = modules.reduce((sum, m) => sum + m.duration, 0);
  const totalResources = modules.reduce((sum, m) => sum + m.resources, 0);

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

            {/* Modules List */}
            <div ref={listRef} className="space-y-3">
              {modules.map((module) => (
                <div key={module.id} className="module-item">
                  <div
                    className={`border-2 rounded-lg transition ${
                      expandedModule === module.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full cursor-pointer flex items-start gap-4 p-4 hover:bg-opacity-50 transition text-left"
                    >
                      {/* Number Badge */}
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm sm:text-base">
                        {module.id}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {module.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Play size={14} />
                            {module.videos} videos
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {module.duration} min
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText size={14} />
                            {module.resources} resources
                          </div>
                        </div>
                      </div>

                      {/* Toggle Icon */}
                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-gray-600 transition transform ${
                          expandedModule === module.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Expanded Content */}
                    {expandedModule === module.id && (
                      <div className="px-4 pb-4">
                        {/* Description */}
                        <p className="text-gray-700 text-xs sm:text-sm mb-4 leading-relaxed">
                          {module.description}
                        </p>

                        {/* Preview Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPreview(module);
                          }}
                          className="px-5 py-2.5 border-2 border-green-700 text-green-700 font-semibold rounded-lg hover:bg-green-700 hover:text-white transition text-xs sm:text-sm flex items-center gap-2 w-fit"
                        >
                          <Play size={16} />
                          Preview Video
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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

      {/* Video Preview Modal */}
      {showVideoModal && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                {selectedModule.title} - Preview
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={selectedModule.videoPreviewUrl}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

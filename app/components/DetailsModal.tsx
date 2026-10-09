"use client";
import React from "react";
// Product content map for easy updates and future extensibility
const PRODUCT_CONTENT: Record<string, {
  features: string[];
  highlightTitle: string;
  highlightText: React.ReactNode;
  badges: string[];
}> = {
  "Market Research Report": {
    features: [
      "Executive Summary with key market indicators & financial opportunity analysis",
      "Complete service model breakdown with regulatory classifications & funding streams",
      "Full licensing roadmap with step-by-step application process & timelines",
      "Administrator & staff requirements with certifications & training details",
      "Reimbursement rates, billing requirements & revenue optimization strategies",
      "Referral pipeline development with relationship building protocols",
      "Facility and equipment requirements checklist",
      "Market trends, competitive landscape & strategic positioning",
      "Comprehensive startup cost analysis with financial projections",
      "Implementation timeline with phase-by-phase action steps",
    ],
    highlightTitle: "Built For Action",
    highlightText: (
      <>
        This isn't generic research—it's an <span className="text-green-300 font-bold">operational blueprint</span> built from current state regulations, real reimbursement data, and proven provider strategies. Every section includes specific agency contacts, form numbers, and direct source links so you can move from research to execution <span className="text-green-300 font-bold">immediately</span>.
      </>
    ),
    badges: ["50+ Pages", "100+ Sources", "PDF Format"],
  },
  "Policy & Procedure Manual": {
    features: [
      "Administrative Policies covering governance, organizational structure & corporate compliance",
      "Personnel Policies for hiring, training, supervision, performance & disciplinary procedures",
      "Client Rights & Responsibilities with grievance procedures and advocacy protocols",
      "Service Delivery Policies for assessments, care planning & individualized services",
      "Health & Safety Policies including infection control, medication management & emergency procedures",
      "Documentation & Record-Keeping policies for clinical, administrative & financial records",
      "Quality Assurance & Improvement policies with audit procedures and corrective action plans",
      "Privacy & Confidentiality policies ensuring HIPAA compliance and information security",
      "Incident Reporting & Risk Management policies with investigation protocols",
      "Environmental Safety policies for facility maintenance, equipment & hazard prevention",
    ],
    highlightTitle: "Survey-Ready Documentation",
    highlightText: (
      <>
        Every policy is written to meet your state’s <span className="text-green-300 font-bold">specific regulatory requirements</span>—not generic templates. Policies include regulatory citations, implementation guidance, and are formatted for <span className="text-green-300 font-bold">immediate surveyor review</span>. Customize with your business details and you’re operational.
      </>
    ),
    badges: ["50+ Policies", "State-Specific", "Word Format"],
  },
  "Pro Forma P&L Template": {
    features: [
      "Revenue Projections based on realistic census growth and payer mix scenarios",
      "Reimbursement Rate Modeling with current Medicaid, Medicare & private pay rates",
      "Staffing Cost Calculator with required positions, wages & benefit assumptions",
      "Facility/Operating Costs breakdown including rent, utilities, supplies & insurance",
      "Startup Cost Itemization for licensing fees, equipment, renovations & working capital",
      "Monthly Cash Flow Projections for the critical first 12 months of operation",
      "Break-Even Analysis showing when your operation becomes profitable",
      "Sensitivity Analysis for best-case, expected, and worst-case scenarios",
      "Funding Requirements Summary for loan applications and investor presentations",
      "Key Performance Indicators dashboard for ongoing financial monitoring",
    ],
    highlightTitle: "Investor & Lender Ready",
    highlightText: (
      <>
        This isn't a generic spreadsheet—it's built with <span className="text-green-300 font-bold">realistic assumptions</span> for your specific program type and state. Revenue projections use actual reimbursement rates, staffing costs reflect required ratios, and expense categories match your real <span className="text-green-300 font-bold">operational needs</span>.
      </>
    ),
    badges: ["12 Months", "3 Scenarios", "Excel Format"],
  },
  "Licensing Documentation Checklist": {
    features: [
      "Pre-Application Requirements covering business formation, zoning verification, and preliminary approvals",
      "Owner/Administrator Qualifications tracking for education, experience, background checks & certifications",
      "Complete Application Package with every required form, attachment, and supporting document itemized",
      "Operational Standards Compliance checklist for service delivery, client rights & program regulations",
      "Staffing Documentation requirements including credentials, training, clearances & personnel files",
      "Policy & Procedure Manual checklist with every required policy mapped to state regulations",
      "Health, Safety & Emergency Systems verification for preparedness plans & incident reporting",
      "Physical Location Requirements for any facility, office, or vehicle standards required",
      "Pre-Inspection & Survey Readiness checklist to ensure approval on the first attempt",
    ],
    highlightTitle: "Your Roadmap to Approval",
    highlightText: (
      <>
        Stop guessing what regulators want to see. This checklist maps every requirement directly to your state’s regulations—organized in the <span className="text-green-300 font-bold">exact sequence</span> you’ll need to complete them. Each item includes specific form numbers, agency contacts, and regulatory citations so <span className="text-green-300 font-bold">nothing falls through the cracks</span>.
      </>
    ),
    badges: ["75+ Items", "Excel Format", "Instant"],
  },
};
import { X, CheckCircle, Zap } from "lucide-react";
import { useToast } from "./SimpleToast";

interface DetailsModalProps {
  open: boolean;
  onClose: () => void;
  onRequestCompare?: () => void;
  state: string;
  agencyType: string;
  price: number;
  oldPrice: number;
  features: string[];
  productKey?: string;
  productDesc?: string;
  productTitle?: string;
}

export default function DetailsModal({
  open,
  onClose,
  onRequestCompare,
  state,
  agencyType,
  price,
  oldPrice,
  features,
  productKey,
  productDesc,
  productTitle,
}: DetailsModalProps) {
  if (!open) return null;

  // Determine which product content to use
  const content = PRODUCT_CONTENT[productTitle || productKey || ""] || PRODUCT_CONTENT["Market Research Report"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-colors">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-8 relative flex flex-col">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-gray-100 rounded-full p-2 hover:bg-gray-200"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
        {/* State Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-800 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
            {state.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">
              {productTitle?.toUpperCase() || productKey?.toUpperCase() || "PRODUCT"}
            </div>
            <div className="text-2xl font-bold text-black">{state}</div>
            <div className="text-xs text-gray-400">State Approved 2025</div>
          </div>
        </div>
        {/* Agency Type */}
        <div className="mb-4">
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded">
            {agencyType}
          </span>
        </div>
        <div className="h-56 overflow-auto">
          {/* Features List */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-bold text-black">What's Inside</span>
            </div>
            <ul className="space-y-3 bg-white rounded-lg p-2 border">
              {content.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-black">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          {/* Highlight Section */}
          <div className="bg-gray-900 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">{content.highlightTitle}</span>
            </div>
            <div className="text-gray-100 text-sm mb-2">{content.highlightText}</div>
            <div className="flex gap-2 mt-2">
              {content.badges.map((badge, idx) => (
                <span key={idx} className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Price & Add to Cart */}
        <div className="flex flex-col items-center mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl font-bold text-black">${price || 'Loading...'}</span>
            {oldPrice && (
              <span className="text-gray-400 line-through text-lg">
                ${oldPrice}
              </span>
            )}
            {oldPrice && price && oldPrice > price && (
              <span className="bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                Save ${(oldPrice - price).toFixed(0)}
              </span>
            )}
          </div>
          <button
            className="w-full bg-green-800 text-white font-semibold py-3 rounded-lg hover:bg-green-900 transition mb-2"
            onClick={() => {
              onClose();
              if (onRequestCompare) {
                onRequestCompare();
              }
            }}
          >
            Add to Cart
          </button>
        </div>
        {/* Footer */}
        <div className="flex justify-center gap-4 text-xs text-gray-600 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-green-700">Secure checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-700">Instant delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-700">Professional-grade</span>
          </div>
        </div>
      </div>
    </div>
  );
}

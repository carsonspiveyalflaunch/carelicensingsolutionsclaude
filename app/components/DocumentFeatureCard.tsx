"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, ChevronDown, ClipboardList, FileText, LineChart, type LucideIcon } from "lucide-react";

export type DocumentFeature = {
  title: string;
  subtitle: string;
  fileType: string;
  fileMeta: string;
  items: string[];
  highlightBox: ReactNode;
  icon: LucideIcon;
};

/** Homepage "See what's inside" copy for the four Launch Kit documents. */
export const LAUNCH_KIT_DOCUMENTS: DocumentFeature[] = [
  {
    title: "Market Research Report",
    subtitle: "Know your market before you invest a dollar.",
    fileType: "PDF",
    fileMeta: "50–60 Pages",
    icon: BarChart3,
    items: [
      "Executive Summary with key market indicators, wait lists, and funding commitments",
      "Service Model Definition covering official program name, waiver authority, and regulatory classification",
      "Feasibility & Licensing pathway with phase-by-phase application process",
      "Automated & Self-Requirement: including education, certification, and training mandates",
      "Funding & Medicaid Method with reimbursement rates, billing policy, and MCO contracting",
      "Referral & Placement Pipeline showing primary referral sources and introducing development partners",
      "Program Design & Operations covering capacity planning, staffing structure, and service delivery",
      "Market & System Trends with competitive analysis and workforce development insights",
      "Target Cost Analysis with detailed financial projection and break-even modeling",
      "Strategic Recommendations with implementation timeline",
    ],
    highlightBox: (
      <>
        <strong>Why it Matters</strong>
        <p className="mt-2">
          This isn&apos;t a generic industry overview—it&apos;s state-specific, program-specific intelligence with current reimbursement rates, real agency contacts, and verified regulatory citations. You&apos;ll understand exactly what the opportunity looks like before you commit.
        </p>
      </>
    ),
  },
  {
    title: "Licensing Documentation Checklist",
    subtitle: "Never miss a requirement, pass on the first attempt!",
    fileType: "Excel",
    fileMeta: "15+ line items",
    icon: ClipboardList,
    items: [
      "Jurisdictional Requirements (business formation, zoning, preliminary approvals)",
      "Owner/Applicant Qualifications (education, experience, background clearances)",
      "Compliance Attestation (policy disclosure, staff checks, inspection prep)",
      "Staffing Documentation (credentials, training, org chart, personnel files)",
      "Physical Location & Readiness (site plan, safety, environmental health)",
      "Program & Service Delivery Systems (implementation plan, program model)",
      "Credentialing & Medicaid Enrollment (if applicable to your market)",
      "Pre-Inspection Readiness (what surveyors look for)",
    ],
    highlightBox: (
      <>
        <strong>Why it Matters</strong>
        <p className="mt-2">
          This checklist approach gives you a single clear list of what to submit—each built for it by state. Every item is mapped to the actual regulation with reform numbers and agency contacts included. Work through it sequentially and your application is complete.
        </p>
      </>
    ),
  },
  {
    title: "Submission-Ready Policy & Procedure Manual",
    subtitle: "The policies regulators expect to see, already written!",
    fileType: "Word Doc",
    fileMeta: "Fully Editable",
    icon: FileText,
    items: [
      "Administrative Policies (governance, organizational structure, compliance oversight)",
      "Client Rights & Grievance Procedures",
      "Admission, Retention & Discharge Policies",
      "Service Delivery & Care Planning Protocols",
      "Health & Safety Procedures (infection control, emergency response, incident reporting)",
      "Medication & Records Management (documentation, performance management)",
      "Customization to licensed-keeping standards",
      "All policies based on state/regulatory template & program type",
    ],
    highlightBox: (
      <>
        <strong>Why it Matters</strong>
        <p className="mt-2">
          Banks, investors, and regulators require policy manual before they’ll approve your licensure—and they always look for what’s listed in this box. This manual is built from actual approved applications, with the latest state-specific regulatory language, and ready to customize with your organization’s details.
        </p>
      </>
    ),
  },
  {
    title: "Pro Forma Profit & Loss Template",
    subtitle: "See your financial runway before launch.",
    fileType: "Excel",
    fileMeta: "12-Month Projection",
    icon: LineChart,
    items: [
      "Startup Cost Breakdown (licensing, insurance, equipment, buildout, working capital)",
      "Monthly Operating Expense Projections (staffing, utilities, rent, supplies)",
      "Revenue Modeling by Payer Mix (Medicaid rates, private pay, Medicare if applicable)",
      "Variable & Fixed Cost Analysis (by line item)",
      "Cash Flow & Breakeven Summary (monthly by position)",
      "Customizable for your specific rates in your market",
    ],
    highlightBox: (
      <>
        <strong>Why it Matters</strong>
        <p className="mt-2">
          This isn’t just a template with blank numbers. It’s built with the numbers that matter, for your state and your program. Plug in your assumptions and you have a presentation-ready financial model.
        </p>
      </>
    ),
  },
];

export function DocumentFeatureCard({
  feature,
  defaultOpen = false,
}: {
  feature: DocumentFeature;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = feature.icon;

  return (
    <div className="bundle-card overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="border-t-4 border-[#2F5D46]" />
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900">
            <Icon className="text-white" size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{feature.title}</h3>
            <p className="mt-1 text-sm italic text-neutral-500">{feature.subtitle}</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-neutral-500">
          {feature.fileType} · {feature.fileMeta}
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-md bg-[#F3F4F3] px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-[#E6ECE8]"
        >
          <span>{open ? "Hide details" : "See what's inside"}</span>
          <ChevronDown className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} size={16} />
        </button>
        <div
          className={`grid transition-all duration-500 ${
            open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <ul className="space-y-2 text-sm text-neutral-700">
              {feature.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-lime-600">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-neutral-700">
              {feature.highlightBox}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentFeatureGrid({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {LAUNCH_KIT_DOCUMENTS.map((feature) => (
        <DocumentFeatureCard key={feature.title} feature={feature} defaultOpen={defaultOpen} />
      ))}
    </div>
  );
}

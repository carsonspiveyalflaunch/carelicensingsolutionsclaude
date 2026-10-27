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
  /** Upsell-only lead. Hidden on the homepage grid. */
  pitch?: string;
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
      "Feasibility and licensing pathway with the application, phase by phase",
      "Administrator and staff requirements: education, certification, and training",
      "Funding and Medicaid: reimbursement rates, billing rules, and MCO contracting",
      "Referral and placement pipeline: who sends residents, and who to build with",
      "Program design and operations: capacity, staffing, and how care is delivered",
      "Market and system trends, competition, and the workforce",
      "Startup cost analysis with the projection and the break-even",
      "Recommendations and the order to move in",
    ],
    pitch:
      "This is the file you already own. It tells you whether the market can pay. It does not file the license, hire anyone, or open the door.",
    highlightBox: (
      <>
        <strong>Why it Matters</strong>
        <p className="mt-2">
          State-specific and program-specific: current rates, agency contacts, and the citations. You see the opening before you spend on a building.
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
      "Pre-inspection readiness: what surveyors look for",
    ],
    pitch:
      "A report with no checklist is how applications get sent back. Miss one filing and you wait. The map never puts the packet in order.",
    highlightBox: (
      <>
        <strong>Why it Matters</strong>
        <p className="mt-2">
          One list, built for your state. Every line maps to the regulation, with the citation and the agency contact. Work it in order and the application is complete.
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
      "Written to your state's record-keeping rules",
      "Policies matched to your state and program, ready for your agency name",
    ],
    pitch:
      "Surveyors ask for policies. Banks ask for policies. A market study is not a manual. This one is already written.",
    highlightBox: (
      <>
        <strong>Why it Matters</strong>
        <p className="mt-2">
          Lenders and regulators expect a policy manual before they move a file. This one comes from approved applications, in your state&apos;s language, ready for your agency name.
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
      "Cash flow and break-even, month by month",
      "Built so you can drop in the rates for your market",
    ],
    pitch:
      "A lender does not fund a PDF of rates. They fund a model. The report has no pro forma. This spreadsheet is the one you hand them.",
    highlightBox: (
      <>
        <strong>Why it Matters</strong>
        <p className="mt-2">
          The numbers are for your state and your program. Change the assumptions and you have a model a lender can read.
        </p>
      </>
    ),
  },
];

export function DocumentFeatureCard({
  feature,
  defaultOpen = false,
  showPitch = false,
}: {
  feature: DocumentFeature;
  defaultOpen?: boolean;
  showPitch?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = feature.icon;

  return (
    <div className="bundle-card overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="border-t-4 border-[#2F5D46]" />
      <div className="p-6">
        {showPitch && feature.pitch ? (
          <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-950">{feature.pitch}</p>
        ) : null}
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

export function DocumentFeatureGrid({
  defaultOpen = false,
  showPitch = false,
}: {
  defaultOpen?: boolean;
  showPitch?: boolean;
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {LAUNCH_KIT_DOCUMENTS.map((feature) => (
        <DocumentFeatureCard key={feature.title} feature={feature} defaultOpen={defaultOpen} showPitch={showPitch} />
      ))}
    </div>
  );
}

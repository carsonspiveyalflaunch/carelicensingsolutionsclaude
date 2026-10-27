export type AcademyModule = {
  id: number;
  title: string;
  videos: number;
  duration: number;
  resources: number;
  description: string;
  videoPreviewUrl: string;
};

/** Operational Success Academy inventory shared by /course and the launch-kit upsell. */
export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: 1,
    title: "Introduction to the Industry",
    videos: 17,
    duration: 170,
    resources: 12,
    description: "Understand the industry landscape, regulations, and opportunities.",
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
    title: "Licensing & Vendorization",
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

export const ACADEMY_TOTALS = {
  modules: ACADEMY_MODULES.length,
  videos: ACADEMY_MODULES.reduce((sum, module) => sum + module.videos, 0),
  minutes: ACADEMY_MODULES.reduce((sum, module) => sum + module.duration, 0),
  resources: ACADEMY_MODULES.reduce((sum, module) => sum + module.resources, 0),
};

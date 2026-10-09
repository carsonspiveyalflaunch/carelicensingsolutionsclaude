import LogoImg from "@/public/assets/images/logo-dark-bg.png";

export type Product = {
  state: string;
  code: string;
  program: string;
  bestValue: boolean;
  type: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  format: string;
  download: boolean;
  flag: string;
  logo: typeof LogoImg;
  year?: number;
};

export const states = [
  { code: "AL", name: "Alabama", flag: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Alabama.svg" },
  { code: "AK", name: "Alaska", flag: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Flag_of_Alaska.svg" },
  { code: "AZ", name: "Arizona", flag: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Arizona.svg" },
  { code: "AR", name: "Arkansas", flag: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Arkansas.svg" },
  { code: "CA", name: "California", flag: "https://upload.wikimedia.org/wikipedia/commons/0/01/Flag_of_California.svg" },
  { code: "CO", name: "Colorado", flag: "https://upload.wikimedia.org/wikipedia/commons/4/46/Flag_of_Colorado.svg" },
  { code: "CT", name: "Connecticut", flag: "https://upload.wikimedia.org/wikipedia/commons/9/96/Flag_of_Connecticut.svg" },
  { code: "DE", name: "Delaware", flag: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Flag_of_Delaware.svg" },
  { code: "FL", name: "Florida", flag: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Flag_of_Florida.svg" },
  { code: "GA", name: "Georgia", flag: "https://upload.wikimedia.org/wikipedia/commons/5/54/Flag_of_Georgia_%28U.S._state%29.svg" },
  { code: "HI", name: "Hawaii", flag: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Flag_of_Hawaii.svg" },
  { code: "ID", name: "Idaho", flag: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_Idaho.svg" },
  { code: "IL", name: "Illinois", flag: "https://upload.wikimedia.org/wikipedia/commons/0/01/Flag_of_Illinois.svg" },
  { code: "IN", name: "Indiana", flag: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Flag_of_Indiana.svg" },
  { code: "IA", name: "Iowa", flag: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Flag_of_Iowa.svg" },
  { code: "KS", name: "Kansas", flag: "https://upload.wikimedia.org/wikipedia/commons/d/da/Flag_of_Kansas.svg" },
  { code: "KY", name: "Kentucky", flag: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Flag_of_Kentucky.svg" },
  { code: "LA", name: "Louisiana", flag: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Flag_of_Louisiana.svg" },
  { code: "ME", name: "Maine", flag: "https://upload.wikimedia.org/wikipedia/commons/3/35/Flag_of_Maine.svg" },
  { code: "MD", name: "Maryland", flag: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Flag_of_Maryland.svg" },
  { code: "MA", name: "Massachusetts", flag: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Flag_of_Massachusetts.svg" },
  { code: "MI", name: "Michigan", flag: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Flag_of_Michigan.svg" },
  { code: "MN", name: "Minnesota", flag: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Flag_of_Minnesota.svg" },
  { code: "MS", name: "Mississippi", flag: "https://upload.wikimedia.org/wikipedia/commons/4/42/Flag_of_Mississippi.svg" },
  { code: "MO", name: "Missouri", flag: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Flag_of_Missouri.svg" },
  { code: "MT", name: "Montana", flag: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Flag_of_Montana.svg" },
  { code: "NE", name: "Nebraska", flag: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Flag_of_Nebraska.svg" },
  { code: "NV", name: "Nevada", flag: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Flag_of_Nevada.svg" },
  { code: "NH", name: "New Hampshire", flag: "https://upload.wikimedia.org/wikipedia/commons/2/28/Flag_of_New_Hampshire.svg" },
  { code: "NJ", name: "New Jersey", flag: "https://upload.wikimedia.org/wikipedia/commons/9/92/Flag_of_New_Jersey.svg" },
  { code: "NM", name: "New Mexico", flag: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_New_Mexico.svg" },
  { code: "NY", name: "New York", flag: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_New_York.svg" },
  { code: "NC", name: "North Carolina", flag: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Flag_of_North_Carolina.svg" },
  { code: "ND", name: "North Dakota", flag: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Flag_of_North_Dakota.svg" },
  { code: "OH", name: "Ohio", flag: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Flag_of_Ohio.svg" },
  { code: "OK", name: "Oklahoma", flag: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Flag_of_Oklahoma.svg" },
  { code: "OR", name: "Oregon", flag: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Flag_of_Oregon.svg" },
  { code: "PA", name: "Pennsylvania", flag: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Flag_of_Pennsylvania.svg" },
  { code: "RI", name: "Rhode Island", flag: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Flag_of_Rhode_Island.svg" },
  { code: "SC", name: "South Carolina", flag: "https://upload.wikimedia.org/wikipedia/commons/6/69/Flag_of_South_Carolina.svg" },
  { code: "SD", name: "South Dakota", flag: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_South_Dakota.svg" },
  { code: "TN", name: "Tennessee", flag: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Tennessee.svg" },
  { code: "TX", name: "Texas", flag: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Texas.svg" },
  { code: "UT", name: "Utah", flag: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Flag_of_Utah.svg" },
  { code: "VT", name: "Vermont", flag: "https://upload.wikazeera.org/wikipedia/commons/4/49/Flag_of_Vermont.svg" },
  { code: "VA", name: "Virginia", flag: "https://upload.wikimedia.org/wikipedia/commons/4/47/Flag_of_Virginia.svg" },
  { code: "WA", name: "Washington", flag: "https://upload.wikimedia.org/wikipedia/commons/5/54/Flag_of_Washington.svg" },
  { code: "WV", name: "West Virginia", flag: "https://upload.wikimedia.org/wikipedia/commons/2/22/Flag_of_West_Virginia.svg" },
  { code: "WI", name: "Wisconsin", flag: "https://upload.wikimedia.org/wikipedia/commons/2/22/Flag_of_Wisconsin.svg" },
  { code: "WY", name: "Wyoming", flag: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Flag_of_Wyoming.svg" },
];

// program categories shown on ProgramTypes component
export const programCategories = [
  "Assisted Living Facilities",
  "Nursing Facilities (SNF)",
  "Home Health Agencies",
  "Adult Day Care Programs",
  "Hospice Programs",
  "Child Care Facilities",
  "Group Homes for Children",
  "Personal Home Care",
  "Residential Care (DD)",
  "Residential Treatment (Children)",
];

// which programs are available in each state (slug names)
// for simplicity we include all categories in every state; this can
// be customized per-code later.
export const statePrograms: Record<string, string[]> = states.reduce((acc, s) => {
  acc[s.code] = [...programCategories];
  return acc;
}, {} as Record<string, string[]>);

// helper for building slugs and comparing
export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

// pre-compute objects with titles and slugs to avoid duplication
export const programCards = programCategories.map((title) => ({
  title,
  slug: slugify(title),
}));

// special programs for states that already had custom entries
const specialPrograms: Record<string, { program: string; bestValue?: boolean }> = {
  AL: { program: "Nursing Facility", bestValue: true },
  CA: {
    program: "Group Home for Adults with Developmental Disabilities",
    bestValue: true,
  },
  DE: { program: "Adult Day Care Program", bestValue: true },
  IL: { program: "Nursing Facility", bestValue: true },
  MN: { program: "Nursing Facility", bestValue: true },
  NV: {
    program: "Ambulatory Surgical Center",
    bestValue: true,
  },
  NY: { program: "Child Care Program", bestValue: true },
  TN: { program: "Home Care Organization", bestValue: true },
  TX: { program: "Adult Day Care Program", bestValue: true },
};

// generate a bundle product for every state/program combination
// look up programs available by state; if none provided fallback to
// the specialPrograms or default.
const generatedStateProducts: Product[] = [];
states.forEach((s) => {
  const available = statePrograms[s.code] || [];
  if (available.length === 0) {
    // if no mapping we fall back to special or default
    const sp = specialPrograms[s.code];
    const program = sp?.program || "Nursing Facility";
    available.push(program);
  }

  available.forEach((program) => {
    const spEntry = specialPrograms[s.code];
    const isSpecial = spEntry && spEntry.program === program;
    generatedStateProducts.push({
      state: s.name,
      code: s.code,
      program,
      bestValue: isSpecial ? spEntry?.bestValue ?? false : false,
      type: "Complete Bundle",
      title: `${s.name} ${program} Complete Bundle`,
      description: "Everything you need in one complete package",
      tags: [s.name, program],
      price: 1297,
      format: "PDF Format",
      download: true,
      flag: s.flag,
      logo: LogoImg,
      year: 2025,
    });
  });
});

// general, non‑state products
const generalProducts: Product[] = [
  {
    state: "General",
    code: "MR",
    program: "Market Research",
    bestValue: false,
    type: "Market Research Report",
    title: "Market Research Report",
    description: "Industry insights and market analysis for care businesses",
    tags: ["Market Research"],
    price: 397,
    format: "PDF Format",
    download: true,
    flag: states.find((s) => s.code === "AL")!.flag,
    logo: LogoImg,
    year: 2025,
  },
  {
    state: "General",
    code: "PM",
    program: "Policies",
    bestValue: false,
    type: "Policy & Procedure Manual",
    title: "Policy & Procedure Manual",
    description: "Complete policy templates and procedures for compliance",
    tags: ["Policy & Procedure"],
    price: 497,
    format: "PDF Format",
    download: true,
    flag: states.find((s) => s.code === "AL")!.flag,
    logo: LogoImg,
    year: 2025,
  },
  {
    state: "General",
    code: "PL",
    program: "Financial",
    bestValue: false,
    type: "Pro Forma P&L Template",
    title: "Pro Forma P&L Template",
    description: "Professional financial projections and profit & loss templates",
    tags: ["Financial Template"],
    price: 297,
    format: "Excel Format",
    download: true,
    flag: states.find((s) => s.code === "AL")!.flag,
    logo: LogoImg,
    year: 2025,
  },
  {
    state: "General",
    code: "LC",
    program: "Checklist",
    bestValue: false,
    type: "Licensing Checklist",
    title: "Licensing Checklist",
    description: "Comprehensive licensing requirements and compliance checklist",
    tags: ["Licensing Checklist"],
    price: 397,
    format: "PDF Format",
    download: true,
    flag: states.find((s) => s.code === "AL")!.flag,
    logo: LogoImg,
    year: 2025,
  },
];

export const allProducts: Product[] = [...generatedStateProducts, ...generalProducts];

export const productTypes = [
  { label: "All Product Types", price: null },
  { label: "Market Research Report", price: 397 },
  { label: "Policy & Procedure Manual", price: 497 },
  { label: "Pro Forma P&L Template", price: 297 },
  { label: "Licensing Checklist", price: 397 },
  { label: "Complete Bundle", price: null },
];



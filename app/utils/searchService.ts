import { allProducts, states, programCategories, Product } from "@/app/data/shopData";

// Search result types
export type SearchResultType = "product" | "state" | "page";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: {
    state?: string;
    program?: string;
    price?: number;
    type?: string;
    flag?: string;
  };
  score: number; // Relevance score for sorting
}

// Static pages to include in search
const staticPages = [
  {
    id: "home",
    title: "Home",
    description: "Welcome to Care Licensing Solutions - Your complete guide to starting and managing care facilities",
    url: "/",
  },
  {
    id: "shop",
    title: "Shop",
    description: "Browse our complete collection of licensing packages, templates, and resources for care facilities",
    url: "/shop",
  },
  {
    id: "states",
    title: "By State",
    description: "Find licensing requirements and resources specific to your state",
    url: "/states",
  },
  {
    id: "get-started",
    title: "Get Started",
    description: "Step-by-step guide to starting your care facility business",
    url: "/get-started",
  },
  {
    id: "course",
    title: "Course",
    description: "Comprehensive training course for care facility licensing and operations",
    url: "/course",
  },
  {
    id: "about",
    title: "About",
    description: "Learn about Care Licensing Solutions and our mission to help care facility owners",
    url: "/about",
  },
];

// Fuzzy search helper - checks if query matches any part of text
function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  return lowerText.includes(lowerQuery);
}

// Calculate relevance score based on match quality
function calculateScore(text: string, query: string, isTitle: boolean = false): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match gets highest score
  if (lowerText === lowerQuery) return 100;

  // Starts with query gets high score
  if (lowerText.startsWith(lowerQuery)) return isTitle ? 90 : 80;

  // Contains query as whole word
  const words = lowerText.split(/\s+/);
  if (words.some(word => word.toLowerCase() === lowerQuery)) return isTitle ? 85 : 75;

  // Contains query anywhere
  if (lowerText.includes(lowerQuery)) return isTitle ? 70 : 60;

  return 0;
}

// Main search function
export function search(query: string, filters?: {
  resultType?: SearchResultType;
  state?: string;
  programType?: string;
}): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  // Search products
  if (!filters?.resultType || filters.resultType === "product") {
    allProducts.forEach((product) => {
      // Skip if state filter doesn't match
      if (filters?.state && product.state !== filters.state && product.code !== filters.state) {
        return;
      }

      // Skip if program type filter doesn't match
      if (filters?.programType && product.program !== filters.programType) {
        return;
      }

      let maxScore = 0;
      let bestMatchField = "";

      // Check title (highest weight)
      const titleScore = calculateScore(product.title, query, true);
      if (titleScore > maxScore) {
        maxScore = titleScore;
        bestMatchField = "title";
      }

      // Check state name
      const stateScore = calculateScore(product.state, query, true);
      if (stateScore > maxScore) {
        maxScore = stateScore;
        bestMatchField = "state";
      }

      // Check program
      const programScore = calculateScore(product.program, query, true);
      if (programScore > maxScore) {
        maxScore = programScore;
        bestMatchField = "program";
      }

      // Check type
      const typeScore = calculateScore(product.type, query, false);
      if (typeScore > maxScore) {
        maxScore = typeScore;
        bestMatchField = "type";
      }

      // Check description
      const descScore = calculateScore(product.description, query, false);
      if (descScore > maxScore) {
        maxScore = descScore;
        bestMatchField = "description";
      }

      // Check tags
      const tagScore = product.tags.some(tag => calculateScore(tag, query, false)) ? 50 : 0;
      if (tagScore > maxScore) {
        maxScore = tagScore;
        bestMatchField = "tags";
      }

      if (maxScore > 0) {
        results.push({
          id: `product-${product.code}-${product.program.replace(/\s+/g, "-")}`,
          type: "product",
          title: product.title,
          subtitle: `${product.type} • ${product.state}`,
          description: product.description,
          url: `/shop?state=${product.code}&program=${encodeURIComponent(product.program)}`,
          metadata: {
            state: product.state,
            program: product.program,
            price: product.price,
            type: product.type,
            flag: product.flag,
          },
          score: maxScore,
        });
      }
    });
  }

  // Search states
  if (!filters?.resultType || filters.resultType === "state") {
    states.forEach((state) => {
      const nameScore = calculateScore(state.name, query, true);
      const codeScore = calculateScore(state.code, query, true);

      const maxScore = Math.max(nameScore, codeScore);

      if (maxScore > 0) {
        results.push({
          id: `state-${state.code}`,
          type: "state",
          title: state.name,
          subtitle: `State: ${state.code}`,
          description: `Browse licensing resources and products for ${state.name}`,
          url: `/shop?state=${state.code}`,
          metadata: {
            state: state.name,
            flag: state.flag,
          },
          score: maxScore,
        });
      }
    });
  }

  // Search pages
  if (!filters?.resultType || filters.resultType === "page") {
    staticPages.forEach((page) => {
      const titleScore = calculateScore(page.title, query, true);
      const descScore = calculateScore(page.description, query, false);

      const maxScore = Math.max(titleScore, descScore);

      if (maxScore > 0) {
        results.push({
          id: `page-${page.id}`,
          type: "page",
          title: page.title,
          description: page.description,
          url: `/shop?search=${encodeURIComponent(query)}`,
          score: maxScore,
        });
      }
    });
  }

  // Sort by score (highest first) and return top 50 results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

// Get recently searched terms from localStorage
export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("recentSearches");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save search term to recent searches
export function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;

  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(q => q !== query);
    const updated = [query, ...filtered].slice(0, 10);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

// Clear recent searches
export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("recentSearches");
  } catch {
    // Ignore localStorage errors
  }
}

// Get search suggestions (popular searches, etc.)
export function getSearchSuggestions(): string[] {
  return [
    "California nursing facility",
    "Texas home health",
    "Florida assisted living",
    "New York child care",
    "Market research report",
    "Policy manual",
    "Licensing checklist",
    "P&L template",
  ];
}
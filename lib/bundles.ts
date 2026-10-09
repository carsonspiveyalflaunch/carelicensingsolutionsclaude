export interface BundleFileMetadata {
  label: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  path?: string;
}

export interface BundleMetadata {
  status?: string;
  quantity?: number;
  state?: string;
  code?: string;
  program?: string;
  productLabel?: string;
  bestValue?: boolean;
  tags?: string[];
  format?: string;
  download?: boolean;
  flag?: string;
  logo?: string;
  year?: number;
  oldPrice?: number;
  bonuses?: string[];
  coursePrice?: number;
  files?: BundleFileMetadata[];
  isDerivedIndividual?: boolean;
  is_individual?: boolean;
}

export interface BundleProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  product_slug: string;
  features: string[];
  metadata?: BundleMetadata;
  state?: string;
  code?: string;
  program?: string;
  product_label?: string;
  tags?: string[];
  created_at?: string;
  is_active?: boolean;
}

export interface BundleFormPayload {
  name: string;
  description: string;
  price: number;
  product_slug?: string;
  state?: string;
  code?: string;
  program?: string;
  product_label?: string;
  tags?: string[];
  metadata: {
    status: string;
    quantity: number;
    state: string;
    code: string;
    program: string;
    productLabel: string;
    bestValue: boolean;
    tags: string[];
    format: string;
    download: boolean;
    flag: string;
    logo: string;
    year: number;
    files?: BundleFileMetadata[];
  };
  features: string[];
  is_active?: boolean;
}

export function normalizeBundleFileLabel(rawLabel: string): string {
  const label = String(rawLabel || "").trim();
  if (!label) {
    return "";
  }

  const normalized = label
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = normalized.toLowerCase();

  if (/market.*research|research.*market/i.test(lower)) {
    return "Market Research Report";
  }
  if (/policy.*procedure|procedure.*policy|policy.*manual|p\s*&\s*p|p\s*and\s*p/i.test(lower)) {
    return "Policy & Procedure Manual";
  }
  if (/pro.*forma|p\s*&\s*l|p\s*and\s*l|pro forma/i.test(lower)) {
    return "Pro Forma P&L Template";
  }
  if (/licensing.*checklist|checklist.*licensing/i.test(lower)) {
    return "Licensing Checklist";
  }

  return normalized;
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : ({} as T);
  } catch (error) {
    // If response is HTML, it's likely a server error page
    if (text && text.includes("<html") || text.includes("<!DOCTYPE")) {
      throw new Error("Server returned an error page. Please check your connection or try again later.");
    }
    throw new Error(`Invalid JSON response: ${error}`);
  }
}

export async function fetchShopProducts(): Promise<BundleProduct[]> {
  const response = await fetch("/api/products", { cache: "no-store" });
  const body = await parseJson<any>(response);
  if (!response.ok) {
    throw new Error(body?.error || "Unable to load storefront products.");
  }
  return body.products || [];
}

export async function fetchAdminBundles(): Promise<BundleProduct[]> {
  const response = await fetch("/api/admin/bundles", { cache: "no-store" });
  const body = await parseJson<any>(response);
  if (!response.ok) {
    throw new Error(body?.error || "Unable to load admin bundles.");
  }
  return body.bundles || [];
}

export async function fetchAdminBundle(id: string): Promise<BundleProduct | null> {
  const response = await fetch(`/api/admin/bundles?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  const body = await parseJson<any>(response);
  if (!response.ok) {
    throw new Error(body?.error || "Unable to load bundle details.");
  }
  return body.bundle || null;
}

export async function createAdminBundle(payload: BundleFormPayload): Promise<BundleProduct> {
  const response = await fetch("/api/admin/bundles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJson<any>(response);
  if (!response.ok) {
    throw new Error(body?.error || "Unable to create bundle.");
  }
  if (!body.bundle) {
    throw new Error("Bundle creation returned no bundle data.");
  }
  return body.bundle;
}

export async function uploadBundleFiles(formData: FormData): Promise<BundleFileMetadata[]> {
  try {
    const response = await fetch("/api/admin/bundles/upload-files", {
      method: "POST",
      body: formData,
    });
    
    const body = await parseJson<any>(response);
    
    if (!response.ok) {
      throw new Error(body?.error || `Upload failed with status ${response.status}`);
    }
    
    return body.files || [];
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to upload bundle files. Please try again.");
  }
}

export async function updateAdminBundle(id: string, payload: Partial<BundleFormPayload>): Promise<BundleProduct> {
  const response = await fetch(`/api/admin/bundles?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJson<any>(response);
  if (!response.ok) {
    throw new Error(body?.error || "Unable to update bundle.");
  }
  if (!body.bundle) {
    throw new Error("Bundle update returned no bundle data.");
  }
  return body.bundle;
}

export async function deleteAdminBundle(id: string): Promise<void> {
  const response = await fetch(`/api/admin/bundles?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const body = await parseJson<any>(response);
  if (!response.ok) {
    throw new Error(body?.error || "Unable to delete bundle.");
  }
  if (body.success !== true) {
    throw new Error("Bundle delete did not complete successfully.");
  }
}

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

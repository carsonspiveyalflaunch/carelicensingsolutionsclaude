/**
 * Bulk import of bundle files from the Care Licensing Solutions Drive export.
 *
 * Given the relative paths of the files in the downloaded (unzipped) Drive
 * folder, work out which state bundle(s) and which of the four bundle
 * resources each file belongs to. Pure functions only, so it can be tested
 * without a browser.
 *
 * Drive layout (Oct 2026):
 *   Policies_Procedures/<State>/<Program>.pdf
 *   Licensing_checklist/<State>/<Program>/<State>_<Program>_Licensing_Checklist.xlsx
 *   .../market_research_reports 2/<State>/Tier-1/<Program>.pdf
 *   Profit and Loss Statements/[New Profit and Loss Folders/]<Program>_PnL.xlsx  (all states)
 *   Home Care Assets/<State>/<license type>/{Licensing_Checklist.xlsx, Market_Research_Report.pdf, Policy_Manual.pdf}
 */

export const PROGRAMS = [
  'Assisted Living Facilities',
  'Nursing Facilities (SNF)',
  'Home Health Agencies',
  'Adult Day Care Programs',
  'Hospice Programs',
  'Child Care Facilities',
  'Group Homes for Children',
  'Personal Home Care',
  'Residential Care (DD)',
  'Residential Treatment (Children)',
  'Ambulatory Surgical Centers',
] as const;
export type Program = (typeof PROGRAMS)[number];

export const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
] as const;

export type Resource = 'policy' | 'licensing' | 'market' | 'pnl';

/** Storage file name stem per resource; the dashboard turns these back into labels. */
export const RESOURCE_LABEL: Record<Resource, string> = {
  policy: 'policy-procedure-manual',
  licensing: 'licensing-checklist',
  market: 'market-research-report',
  pnl: 'pro-forma-pl-template',
};

export const RESOURCE_TITLE: Record<Resource, string> = {
  policy: 'Policy & Procedure Manual',
  licensing: 'Licensing Checklist',
  market: 'Market Research Report',
  pnl: 'Pro Forma P&L Template',
};

/** Same slug rule the product catalog was seeded with. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function bundleSlug(state: string, program: Program): string {
  return slugify(`${state} ${program} Complete Bundle`);
}

/** lower case, separators to spaces, parentheses and dashes dropped. */
function norm(value: string): string {
  return value
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_\-—–()&,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map a program name as Drive spells it (file or folder name) to one of the
 * site's 10 programs, or null when it doesn't belong to any (e.g. ambulatory
 * surgery, plain intermediate care facilities).
 * Order matters: specific rules run before the broad ones.
 */
export function classifyProgram(raw: string): Program | null {
  const n = norm(raw);
  if (!n) return null;

  if (/ambulatory|surg/.test(n)) return 'Ambulatory Surgical Centers';
  if (/intermediate care/.test(n)) return null; // ICF/IID no longer sold
  if (/residential treatment|\brtf\b|childrens rtf/.test(n)) return 'Residential Treatment (Children)';
  if (/group homes? for children|children group ?home|dd children group ?home/.test(n)) return 'Group Homes for Children';
  if (/hospice/.test(n)) return 'Hospice Programs';
  if (/home health/.test(n)) return 'Home Health Agencies';
  if (/adult day/.test(n)) return 'Adult Day Care Programs';
  if (/child ?care|child day ?care|daycare/.test(n)) return 'Child Care Facilities';
  if (/home care|homemaker|companion|personal assistance|home and community based care|private pay home/.test(n)) {
    return 'Personal Home Care';
  }
  if (/nursing|\bsnf\b/.test(n)) return 'Nursing Facilities (SNF)';
  if (
    /developmental|habilitation|\bdd\b|mental illness|community|group homes? for adults|group homes?$|residential services|^residential facilities/.test(n)
  ) {
    return 'Residential Care (DD)';
  }
  if (
    /assisted living|supportive living|rcfe|elderly|personal care homes?|basic care|adult care|adult residential|rest homes?|residential care|adult family homes?|adult foster|\balf\b/.test(n)
  ) {
    return 'Assisted Living Facilities';
  }
  return null;
}

function findState(segments: string[]): string | null {
  for (const seg of segments) {
    const s = seg.replace(/_/g, ' ').trim().toLowerCase();
    const hit = STATES.find((st) => st.toLowerCase() === s);
    if (hit) return hit;
  }
  return null;
}

export interface ImportTarget {
  state: string;
  program: Program;
  resource: Resource;
}

export interface Classified {
  path: string;
  targets: ImportTarget[];
  /** Why a file is not imported (when targets is empty). */
  skipReason?: string;
}

const SKIP_EXT = /\.(backup|json|txt|ds_store|docx?|gdoc|ini)$/i;

/**
 * Work out where one file from the Drive export goes.
 * `path` is the browser's webkitRelativePath, e.g.
 * "Care Licensing Solutions/Policies_Procedures/Texas/Hospice_programs.pdf".
 */
export function classifyPath(path: string): Classified {
  const segments = path.split('/').filter(Boolean);
  const fileName = segments[segments.length - 1] || '';
  const lowerPath = path.toLowerCase();

  if (fileName.startsWith('.') || SKIP_EXT.test(fileName)) {
    return { path, targets: [], skipReason: 'Not a product file' };
  }
  if (!/\.(pdf|xlsx|xls)$/i.test(fileName)) {
    return { path, targets: [], skipReason: 'Unsupported file type' };
  }
  if (/marketing brain|\/rates\//.test(lowerPath) || /nationwide/i.test(fileName)) {
    return { path, targets: [], skipReason: 'Not part of the bundles' };
  }

  // Home Care Assets: generic file names, program is always Personal Home Care.
  if (lowerPath.includes('home care assets/')) {
    const state = findState(segments);
    if (!state) return { path, targets: [], skipReason: 'No state in path' };
    const n = norm(fileName);
    const resource: Resource | null = /licensing/.test(n)
      ? 'licensing'
      : /market/.test(n)
        ? 'market'
        : /policy/.test(n)
          ? 'policy'
          : null;
    if (!resource) return { path, targets: [], skipReason: 'Unknown home care file' };
    return { path, targets: [{ state, program: 'Personal Home Care', resource }] };
  }

  // P&L templates: one per program, the same for every state.
  if (lowerPath.includes('profit and loss')) {
    const program = classifyProgram(fileName.replace(/pnl|generator|private pay|medicare|all states/gi, ' '));
    if (!program) return { path, targets: [], skipReason: 'P&L not matched to a program' };
    return {
      path,
      targets: STATES.map((state) => ({ state, program, resource: 'pnl' as Resource })),
    };
  }

  let resource: Resource | null = null;
  let programName = '';
  if (lowerPath.includes('policies_procedures/')) {
    resource = 'policy';
    programName = fileName;
  } else if (lowerPath.includes('licensing_checklist/')) {
    resource = 'licensing';
    // <State>/<Program folder>/<file>: the folder names the program.
    programName = segments.length >= 2 ? segments[segments.length - 2] : fileName;
  } else if (lowerPath.includes('market_research') || lowerPath.includes('market research')) {
    resource = 'market';
    programName = fileName;
  }
  if (!resource) return { path, targets: [], skipReason: 'Not in a bundle resource folder' };

  const state = findState(segments);
  if (!state) return { path, targets: [], skipReason: 'No state in path' };
  const program = classifyProgram(programName);
  if (!program) return { path, targets: [], skipReason: `Program not offered: ${programName}` };
  return { path, targets: [{ state, program, resource }] };
}

export interface PlannedUpload {
  path: string;
  bundleSlug: string;
  /** Storage name stem, e.g. "policy-procedure-manual" or "policy-procedure-manual-2". */
  label: string;
  state: string;
  program: Program;
  resource: Resource;
}

/**
 * Turn classified files into the upload list. Several files can land on the
 * same bundle resource (e.g. Texas has both "Assisted living facilities" and
 * "Residential care facilities"); those get numbered labels. For P&L, a file
 * from "New Profit and Loss Folders" wins over an older copy of the same program.
 */
export function planUploads(classified: Classified[]): PlannedUpload[] {
  const pnlBest = new Map<Program, string>();
  for (const c of classified) {
    for (const t of c.targets) {
      if (t.resource !== 'pnl') continue;
      const current = pnlBest.get(t.program);
      const isNew = /new profit and loss/i.test(c.path);
      if (!current || (isNew && !/new profit and loss/i.test(current))) pnlBest.set(t.program, c.path);
      break;
    }
  }

  const counts = new Map<string, number>();
  const plan: PlannedUpload[] = [];
  const sorted = [...classified].sort((a, b) => a.path.localeCompare(b.path));
  for (const c of sorted) {
    for (const t of c.targets) {
      if (t.resource === 'pnl' && pnlBest.get(t.program) !== c.path) continue;
      const slug = bundleSlug(t.state, t.program);
      const key = `${slug}|${t.resource}`;
      const n = (counts.get(key) || 0) + 1;
      counts.set(key, n);
      // One file per resource per bundle: extra copies in the export would show
      // buyers the same item twice, so only the first (by path) is kept.
      if (n > 1) continue;
      plan.push({
        path: c.path,
        bundleSlug: slug,
        label: RESOURCE_LABEL[t.resource],
        state: t.state,
        program: t.program,
        resource: t.resource,
      });
    }
  }
  return plan;
}

export function contentTypeFor(fileName: string): string {
  if (/\.pdf$/i.test(fileName)) return 'application/pdf';
  if (/\.xlsx$/i.test(fileName)) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (/\.xls$/i.test(fileName)) return 'application/vnd.ms-excel';
  return 'application/octet-stream';
}

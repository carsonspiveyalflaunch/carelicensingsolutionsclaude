import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { requireAdmin } from "@/utils/admin-auth";

// Verified bundle files produced by content-factory (committed to the private repo and
// shipped with this function via outputFileTracingIncludes in next.config.ts).
const OUTPUT_DIR = path.join(process.cwd(), "content-factory", "output");
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";

// Storage names match the bulk importer so a publish replaces the old Drive files.
const TARGETS: { match: RegExp; name: string; type: string }[] = [
  { match: /Market Research Report\.pdf$/i, name: "market-research-report.pdf", type: "application/pdf" },
  {
    match: /Pro Forma PnL\.xlsx$/i,
    name: "pro-forma-pl-template.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  {
    match: /Licensing Checklist\.xlsx$/i,
    name: "licensing-checklist.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
];

async function listBundles() {
  let dirs: string[] = [];
  try {
    dirs = (await fs.readdir(OUTPUT_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && /^[a-z0-9-]+-complete-bundle$/.test(d.name))
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
  const out = [];
  for (const slug of dirs) {
    const files = await fs.readdir(path.join(OUTPUT_DIR, slug));
    const matched = TARGETS.map((t) => ({ ...t, file: files.find((f) => t.match.test(f)) })).filter((t) => t.file);
    out.push({ slug, files: matched.map((m) => m.name) });
  }
  return out;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ bundles: await listBundles() });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const slug = String(body?.slug || "");
  if (!/^[a-z0-9-]+-complete-bundle$/.test(slug)) {
    return NextResponse.json({ error: "Invalid bundle" }, { status: 400 });
  }
  const dir = path.join(OUTPUT_DIR, slug);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return NextResponse.json({ error: "No verified files for this bundle" }, { status: 404 });
  }
  const supabase = createServerSupabaseClient();
  const uploaded: string[] = [];
  for (const t of TARGETS) {
    const file = files.find((f) => t.match.test(f));
    if (!file) continue;
    const data = await fs.readFile(path.join(dir, file));
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${slug}/${t.name}`, data, { upsert: true, contentType: t.type, cacheControl: "3600" });
    if (error) {
      return NextResponse.json({ error: `${t.name}: ${error.message}`, uploaded }, { status: 500 });
    }
    uploaded.push(t.name);
  }
  return NextResponse.json({ slug, uploaded });
}

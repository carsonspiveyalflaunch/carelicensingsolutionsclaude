import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { requireAdmin } from "@/utils/admin-auth";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bundle-files";
const COPY = /^(.*)-\d+(\.[a-z0-9]+)$/i;

// Removes numbered extra copies (e.g. "licensing-checklist-2.xlsx") from every bundle folder,
// but only when the main file ("licensing-checklist.xlsx") is still there.
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const storage = createServerSupabaseClient().storage.from(BUCKET);

  const folders: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list("", { limit: 1000, offset });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    folders.push(...(data || []).filter((e) => !e.id && e.name).map((e) => e.name));
    if (!data || data.length < 1000) break;
  }

  const toRemove: string[] = [];
  const queue = [...folders];
  const worker = async () => {
    while (queue.length > 0) {
      const slug = queue.shift()!;
      const { data } = await storage.list(slug, { limit: 100 });
      const names = (data || []).filter((f) => f.id && f.name).map((f) => f.name);
      const stems = new Set(names.map((n) => n.replace(/\.[a-z0-9]+$/i, "")));
      for (const name of names) {
        const m = name.match(COPY);
        if (m && stems.has(m[1])) toRemove.push(`${slug}/${name}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  for (let i = 0; i < toRemove.length; i += 100) {
    const { error } = await storage.remove(toRemove.slice(i, i + 100));
    if (error) {
      return NextResponse.json({ error: error.message, removed: i }, { status: 500 });
    }
  }
  return NextResponse.json({ removed: toRemove.length });
}

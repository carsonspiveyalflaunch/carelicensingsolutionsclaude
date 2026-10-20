import Link from "next/link";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { goSlug, PROGRAM_HEADLINE } from "@/lib/go-links";

// Server-rendered list of every live bundle landing page, grouped by state.
// Gives visitors (and search engines) a plain link to each /go page.
export default async function StatesDirectory() {
  let rows: { state: string; code: string; program: string }[] = [];
  try {
    const { data } = await createServerSupabaseClient()
      .from("products")
      .select("state, code, program")
      .eq("type", "bundle")
      .eq("is_active", true)
      .like("product_slug", "%complete-bundle");
    rows = data || [];
  } catch {
    return null;
  }
  const byState = new Map<string, { code: string; program: string }[]>();
  for (const r of rows) {
    if (!r.state || !goSlug(r.code, r.program)) continue;
    const list = byState.get(r.state) || [];
    if (!list.some((x) => x.program === r.program)) list.push({ code: r.code, program: r.program });
    byState.set(r.state, list);
  }
  const states = [...byState.keys()].sort();
  if (!states.length) return null;

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl font-bold text-[#2F5D46] md:text-3xl">Licensing guides by state and program</h2>
        <p className="mt-2 text-gray-600">
          Choose your state and the type of care business you&apos;re opening.
        </p>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {states.map((state) => (
            <div key={state}>
              <h3 className="text-lg font-semibold text-gray-900">{state}</h3>
              <ul className="mt-2 space-y-1">
                {byState
                  .get(state)!
                  .sort((a, b) => a.program.localeCompare(b.program))
                  .map(({ code, program }) => (
                    <li key={program}>
                      <Link href={`/go/${goSlug(code, program)}`} className="text-sm text-[#2F5D46] hover:underline">
                        How to open {(PROGRAM_HEADLINE[program] || program).replace(/^(a|an) /, "")} in {state}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { chatSystemPrompt } from "@/lib/chat-prompt";
import { PROGRAM_ALIASES } from "@/lib/go-links";
import { createServerSupabaseClient } from "@/utils/supabase-server";

// Which bundle pages actually exist, per state, so the assistant never links a
// program a state doesn't have. Cached in memory for 10 minutes.
let catalog: { text: string; at: number } | null = null;
async function bundleCatalog(): Promise<string> {
  if (catalog && Date.now() - catalog.at < 10 * 60_000) return catalog.text;
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("products")
      .select("code, program")
      .eq("type", "bundle")
      .eq("is_active", true)
      .like("product_slug", "%complete-bundle")
      .limit(2000);
    const byState: Record<string, Set<string>> = {};
    for (const r of data || []) {
      const alias = PROGRAM_ALIASES[r.program as string];
      if (!alias || !r.code) continue;
      (byState[r.code] ||= new Set()).add(alias);
    }
    const lines = Object.keys(byState).sort().map((c) => `${c}: ${[...byState[c]].join(", ")}`);
    const text = lines.length
      ? `\n\n## BUNDLE PAGES THAT EXIST (only link these; if their program isn't listed for their state, use /get-started?state=XX)\n${lines.join("\n")}`
      : "";
    catalog = { text, at: Date.now() };
    return text;
  } catch (e) {
    console.error("Chat catalog load failed:", e);
    return "";
  }
}

// Site sales assistant. Streams an OpenAI-style SSE response from the Vercel AI
// Gateway. Auth: AI_GATEWAY_API_KEY if set, otherwise the deployment's OIDC token.
// Model: CHAT_MODEL (default anthropic/claude-sonnet-5.5).
export const runtime = "nodejs";
export const maxDuration = 60;

const GATEWAY = "https://ai-gateway.vercel.sh/v1/chat/completions";
const MAX_TURNS = 40;
const MAX_CHARS = 2000;

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const raw: unknown[] = Array.isArray(body.messages) ? body.messages : [];
  const messages: Msg[] = raw
    .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "No message" }, { status: 400 });
  }

  const page = typeof body.currentPage === "string" ? body.currentPage.slice(0, 200) : "";
  const state = typeof body.stateCode === "string" && /^[A-Z]{2}$/.test(body.stateCode) ? body.stateCode : "";
  const program = typeof body.program === "string" ? body.program.slice(0, 40) : "";
  let context = "";
  if (page) context += `\n\n[CONTEXT: The visitor is on ${page}. If it's a /go/ bundle page, they're already looking at that exact bundle.]`;
  if (state) context += `\n[CONTEXT: State already locked: ${state}. Don't ask again.]`;
  if (program) context += `\n[CONTEXT: Program already locked: ${program}.]`;

  const token = process.env.AI_GATEWAY_API_KEY || req.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Chat isn't set up yet. Please try again later." }, { status: 503 });
  }

  const upstream = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.CHAT_MODEL || "anthropic/claude-sonnet-5.5",
      stream: true,
      max_tokens: 2000,
      temperature: 0.6,
      messages: [{ role: "system", content: chatSystemPrompt() + (await bundleCatalog()) + context }, ...messages],
    }),
  }).catch((e) => {
    console.error("Chat gateway fetch failed:", e);
    return null;
  });

  if (!upstream || !upstream.ok || !upstream.body) {
    const detail = upstream ? await upstream.text().catch(() => "") : "";
    console.error("Chat gateway error:", upstream?.status, detail.slice(0, 500));
    return NextResponse.json({ error: "I'm having trouble connecting right now. Mind trying again in a sec?" }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" },
  });
}

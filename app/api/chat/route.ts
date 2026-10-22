import { NextRequest, NextResponse } from "next/server";
import { chatSystemPrompt } from "@/lib/chat-prompt";

// Site sales assistant. Streams an OpenAI-style SSE response from the Vercel AI
// Gateway. Auth: AI_GATEWAY_API_KEY if set, otherwise the deployment's OIDC token.
// Model: CHAT_MODEL (default anthropic/claude-sonnet-4).
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
      model: process.env.CHAT_MODEL || "anthropic/claude-sonnet-4",
      stream: true,
      max_tokens: 500,
      temperature: 0.6,
      messages: [{ role: "system", content: chatSystemPrompt() + context }, ...messages],
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

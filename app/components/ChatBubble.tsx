"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X, Send, User, Search, RotateCcw } from "lucide-react";
import { STATE_NAMES } from "@/lib/us-states";

// Site sales assistant. Ported from the Lovable "Licensing Concierge":
// streaming replies, quick-reply buttons, inline state picker, and hidden tags
// the model emits ([STATE_LOCKED], [PROGRAM_LOCKED], [LEAD_CAPTURE], ...).

type Message = { role: "user" | "assistant"; content: string; quickReplies?: string[]; showStatePicker?: boolean };

const STORAGE_KEY = "cls-chat-v1";
const TOOLTIP_KEY = "cls-chat-tooltip-v1";
const HIDE_ON = ["/admin", "/dashboard", "/checkout"];
const OPENING_REPLIES = ["I know my state", "Still exploring", "Already in process"];

const GREETINGS = [
  "Hey! 👋 Are you looking to open a care business in a specific state, or still figuring out where to start?",
  "Hi there! Most people here are trying to figure out their licensing next step. Where are you in the process?",
  "Hey! I help people get through state care licensing every day. Want me to point you in the right direction?",
];

function greeting(): Message {
  return { role: "assistant", content: GREETINGS[new Date().getDate() % GREETINGS.length], quickReplies: OPENING_REPLIES };
}

function store<T>(key: string, value?: T): T | null {
  try {
    if (value === undefined) {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
  return null;
}

// Pull hidden tags out of a reply and return clean text + what they said.
function parseReply(text: string) {
  const state = /\[STATE_LOCKED:\s*([A-Z]{2})\]/.exec(text)?.[1] || null;
  const program = /\[PROGRAM_LOCKED:\s*([a-z-]+)\]/.exec(text)?.[1] || null;
  const email = /\[LEAD_CAPTURE:\s*([^\]\s]+)\]/.exec(text)?.[1] || null;
  const phone = /\[PHONE_CAPTURE:\s*([^\]]+)\]/.exec(text)?.[1] || null;
  const showStatePicker = /\[STATE_PICKER\]/.test(text);
  const qr = /\[QUICK_REPLIES:\s*([^\]]+)\]/.exec(text);
  const quickReplies = qr ? qr[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 4) : [];
  const clean = text
    .replace(/\[(STATE_LOCKED|PROGRAM_LOCKED|LEAD_CAPTURE|PHONE_CAPTURE|QUICK_REPLIES)[^\]]*\]/g, "")
    .replace(/\[STATE_PICKER\]/g, "")
    // Hide a half-streamed tag at the very end.
    .replace(/\[[A-Z_]*(:[^\]]*)?$/, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { clean, state, program, email, phone, showStatePicker, quickReplies };
}

function renderLine(text: string, onNav: (href: string) => void) {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length) {
    const bold = /\*\*(.+?)\*\*/.exec(rest);
    const link = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest);
    const bi = bold?.index ?? Infinity;
    const li = link?.index ?? Infinity;
    if (bi === Infinity && li === Infinity) {
      parts.push(rest);
      break;
    }
    if (bold && bi <= li) {
      parts.push(rest.slice(0, bi), <strong key={key++}>{bold[1]}</strong>);
      rest = rest.slice(bi + bold[0].length);
    } else if (link) {
      const href = link[2];
      const internal = href.startsWith("/");
      parts.push(
        rest.slice(0, li),
        <a
          key={key++}
          href={internal ? href : "#"}
          onClick={(e) => {
            if (internal) {
              e.preventDefault();
              onNav(href);
            } else e.preventDefault();
          }}
          className="font-semibold text-emerald-700 underline hover:text-emerald-900"
        >
          {link[1]}
        </a>,
      );
      rest = rest.slice(li + link[0].length);
    }
  }
  return parts;
}

function Bubble({ text, onNav }: { text: string; onNav: (href: string) => void }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="mb-2 last:mb-0">
          {para.split("\n").map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {renderLine(line, onNav)}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

function StatePicker({ onSelect, disabled }: { onSelect: (name: string) => void; disabled: boolean }) {
  const [q, setQ] = useState("");
  const list = Object.entries(STATE_NAMES).filter(
    ([code, name]) => name.toLowerCase().includes(q.toLowerCase()) || code.toLowerCase() === q.toLowerCase(),
  );
  return (
    <div className="ml-9 mt-2 max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative p-2">
        <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search states..."
          disabled={disabled}
          className="w-full rounded-lg bg-slate-100 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />
      </div>
      <div className="grid max-h-[160px] grid-cols-3 gap-1 overflow-y-auto px-1 pb-1">
        {list.slice(0, 30).map(([code, name]) => (
          <button
            key={code}
            onClick={() => onSelect(name)}
            disabled={disabled}
            title={name}
            className="rounded-lg px-2 py-1.5 text-center text-xs hover:bg-emerald-50 disabled:opacity-50"
          >
            <span className="font-bold text-emerald-800">{code}</span>
            <span className="block truncate text-[10px] text-slate-500">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatBubble() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [state, setState] = useState<string | null>(null);
  const [program, setProgram] = useState<string | null>(null);
  const [leadSent, setLeadSent] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore this tab's conversation.
  useEffect(() => {
    const saved = store<{ messages: Message[]; state: string | null; program: string | null; leadSent: boolean }>(STORAGE_KEY);
    if (saved?.messages?.length) {
      setMessages(saved.messages);
      setState(saved.state);
      setProgram(saved.program);
      setLeadSent(!!saved.leadSent);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) store(STORAGE_KEY, { messages, state, program, leadSent });
  }, [messages, state, program, leadSent]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Nudge once per session after a few seconds.
  useEffect(() => {
    if (open || store<boolean>(TOOLTIP_KEY)) return;
    const t = setTimeout(() => {
      setTooltip(true);
      store(TOOLTIP_KEY, true);
    }, 8000);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const onNav = useCallback((href: string) => router.push(href), [router]);

  const saveLead = useCallback(
    async (email: string, phone: string | null, st: string | null, prog: string | null) => {
      const slug = st && prog && prog !== "other" ? `${st.toLowerCase()}-${prog}` : undefined;
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, phone: phone || undefined, source: "chat", slug, stateCode: st || undefined }),
        });
      } catch {}
    },
    [],
  );

  const send = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || loading) return;
      const history = [...messages.map((m) => ({ ...m, quickReplies: undefined, showStatePicker: false })), { role: "user" as const, content: trimmed }];
      setMessages(history);
      setInput("");
      setLoading(true);
      setTyping(true);
      let raw = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            currentPage: pathname,
            stateCode: state,
            program,
          }),
        });
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Something went wrong");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let first = true;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, nl).replace(/\r$/, "");
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const delta = JSON.parse(data).choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta) {
                raw += delta;
                if (first) {
                  first = false;
                  setTyping(false);
                }
                const { clean } = parseReply(raw);
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (prev.length > history.length && last?.role === "assistant") {
                    return [...prev.slice(0, -1), { role: "assistant", content: clean }];
                  }
                  return [...prev, { role: "assistant", content: clean }];
                });
              }
            } catch {}
          }
        }
        const parsed = parseReply(raw);
        const nextState = state || parsed.state;
        const nextProgram = program || parsed.program;
        if (parsed.state && !state) setState(parsed.state);
        if (parsed.program && !program) setProgram(parsed.program);
        setMessages((prev) => {
          const base = prev.length > history.length ? prev.slice(0, -1) : prev;
          return [
            ...base,
            {
              role: "assistant",
              content: parsed.clean || "Sorry, I lost my train of thought. Can you say that again?",
              quickReplies: parsed.quickReplies,
              showStatePicker: parsed.showStatePicker && !nextState,
            },
          ];
        });
        if (parsed.email && !leadSent) {
          setLeadSent(true);
          saveLead(parsed.email, parsed.phone, nextState, nextProgram);
        }
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: e instanceof Error && e.message ? e.message : "I'm having trouble connecting right now. Mind trying again?" },
        ]);
      } finally {
        setTyping(false);
        setLoading(false);
      }
    },
    [input, loading, messages, pathname, state, program, leadSent, saveLead],
  );

  const reset = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    setMessages([greeting()]);
    setState(null);
    setProgram(null);
  };

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex max-h-[75vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6 sm:w-[400px]">
          <div className="flex items-center gap-3 bg-emerald-800 px-4 py-3 text-white">
            <div className="relative h-10 w-10 flex-shrink-0">
              <img src="/carson-headshot.jpg" alt="Carson" className="h-10 w-10 rounded-full border-2 border-white/40 object-cover" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-emerald-800 bg-lime-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Carson&apos;s AI Assistant</p>
              <p className="text-xs opacity-80">Care Licensing Solutions · replies instantly</p>
            </div>
            <button onClick={reset} title="New conversation" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-[300px] flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      m.role === "user" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <img src="/carson-headshot.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "rounded-br-md bg-emerald-700 text-white" : "rounded-bl-md bg-slate-100 text-slate-900"
                    }`}
                  >
                    <Bubble text={m.content} onNav={onNav} />
                  </div>
                </div>
                {i === messages.length - 1 && !loading && m.quickReplies?.length ? (
                  <div className="ml-9 mt-2 flex flex-wrap gap-2">
                    {m.quickReplies.map((r) => (
                      <button
                        key={r}
                        onClick={() => send(r)}
                        className="rounded-full border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                ) : null}
                {i === messages.length - 1 && m.showStatePicker ? <StatePicker onSelect={(n) => send(n)} disabled={loading} /> : null}
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <img src="/carson-headshot.jpg" alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200 p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type a message..."
                disabled={loading}
                maxLength={1000}
                className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {tooltip && !open && (
        <button
          onClick={() => {
            setTooltip(false);
            setOpen(true);
          }}
          className="fixed bottom-6 right-24 z-50 max-w-[230px] rounded-2xl border-2 border-lime-300 bg-white px-4 py-3 text-left shadow-2xl"
        >
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <img src="/carson-headshot.jpg" alt="" className="h-6 w-6 rounded-full object-cover" /> Free licensing help
          </p>
          <p className="mt-0.5 text-xs text-slate-600">Ask about your state. Instant answers, no signup.</p>
        </button>
      )}

      <button
        onClick={() => {
          setOpen((o) => !o);
          setTooltip(false);
        }}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-4 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-emerald-950 text-white shadow-[0_0_30px_rgba(190,242,100,0.45)] transition hover:scale-110 sm:right-6"
      >
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-lime-300/30" />}
        {open ? (
          <X className="relative h-6 w-6" />
        ) : (
          <>
            <img src="/carson-headshot.jpg" alt="Chat with Carson's AI assistant" className="relative h-14 w-14 rounded-full border-2 border-lime-300 object-cover" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-700">
              <MessageCircle className="h-3 w-3" />
            </span>
          </>
        )}
      </button>
    </>
  );
}

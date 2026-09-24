import { AiQuotaBadge } from "@/components/ai-quota-badge";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Bot, Send, UserRound } from "lucide-react";
import { askTutor } from "@/lib/tutor.functions";
import { useSubject } from "@/lib/subject";

export const Route = createFileRoute("/_authenticated/$subject/ai-ustoz")({
  head: () => ({
    meta: [
      { title: "AI ustoz — StartEdu" },
      { name: "description", content: "Matematika bo'yicha savollaringizga javob beradigan AI ustoz bilan suhbatlashing." },
      { property: "og:title", content: "AI ustoz — StartEdu" },
      { property: "og:description", content: "Matematika bo'yicha savollaringizga javob beradigan AI ustoz." },
    ],
  }),
  component: AiTutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AiTutorPage() {
  const subject = useSubject();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await askTutor({ data: { subject, messages: next.slice(-20) } });
      setMessages([...next, { role: "assistant", content: reply || "Javob olinmadi." }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary glow">
          <Bot className="h-6 w-6 text-primary-foreground" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">AI ustoz</h1>
          <div className="mt-2"><AiQuotaBadge /></div>
          <p className="text-sm text-muted-foreground">
            Savolingizni yozing — qadam-baqadam tushuntirib beradi.
          </p>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-surface/40 p-4"
      >
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Masalan: "Kvadrat tenglamani qanday yechaman?" yoki "Trigonometriya formulalarini tushuntir"
              </p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-brand">
                <Bot className="h-4 w-4" />
              </span>
            )}
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary">
                <UserRound className="h-4 w-4" />
              </span>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex gap-3">
            <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-brand">
              <Bot className="h-4 w-4 animate-pulse" />
            </span>
            <div className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
              O'ylayapman…
            </div>
          </div>
        )}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>

      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Savolingizni yozing…"
          className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Yuborish"
          className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground glow transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

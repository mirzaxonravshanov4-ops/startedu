import { AiQuotaBadge } from "@/components/ai-quota-badge";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Target } from "lucide-react";
import { generateTwinPlan } from "@/lib/tutor.functions";
import { useSubject } from "@/lib/subject";

export const Route = createFileRoute("/_authenticated/$subject/ai-twin")({
  head: () => ({
    meta: [
      { title: "AI Twin — StartEdu" },
      { name: "description", content: "Maqsadingizga mos shaxsiy o'quv rejasini AI Twin tuzib beradi." },
      { property: "og:title", content: "AI Twin — StartEdu" },
      { property: "og:description", content: "Maqsadingizga mos shaxsiy o'quv rejasi." },
    ],
  }),
  component: AiTwinPage,
});

type Level = "boshlang'ich" | "o'rta" | "yuqori";

function AiTwinPage() {
  const subject = useSubject();
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<Level>("o'rta");
  const [days, setDays] = useState(14);
  const [plan, setPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!goal.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const text = await generateTwinPlan({
        data: { subject, goal: goal.trim(), level, days },
      });
      setPlan(text || "Reja tuzilmadi. Qayta urinib ko'ring.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary glow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">AI Twin</h1>
          <div className="mt-2"><AiQuotaBadge /></div>
          <p className="text-sm text-muted-foreground">
            Maqsadingizni yozing — shaxsiy kunma-kun o'quv rejasi tuzib beradi.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-surface/40 p-5">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <Target className="h-4 w-4 text-brand" /> Maqsad
          </span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Masalan: DTM imtihoniga tayyorlanish, algebra bo'yicha 90% natija"
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Daraja</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="boshlang'ich">Boshlang'ich</option>
              <option value="o'rta">O'rta</option>
              <option value="yuqori">Yuqori</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Muddat (kun)</span>
            <input
              type="number"
              min={3}
              max={30}
              value={days}
              onChange={(e) => setDays(Math.max(3, Math.min(30, Number(e.target.value) || 3)))}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <button
          onClick={() => void generate()}
          disabled={busy || goal.trim().length < 3}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground glow transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
        >
          {busy ? "Reja tuzilmoqda…" : "Shaxsiy rejani tuzish"}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {plan && (
        <div className="mt-6 rounded-2xl border border-border bg-surface/40 p-5">
          <h2 className="mb-3 text-base font-semibold">Sizning rejangiz</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {plan}
          </div>
        </div>
      )}
    </div>
  );
}

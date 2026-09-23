import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LatexText } from "@/components/latex-text";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/questions")({
  head: () => ({ meta: [{ title: "Savollar — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminQuestions,
});

type Opt = { body: string; is_correct: boolean };
type Kind = "test" | "written";

function AdminQuestions() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>("test");
  const [topicId, setTopicId] = useState("");
  const [body, setBody] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [section, setSection] = useState("");
  const [explanation, setExplanation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [wMode, setWMode] = useState<"open" | "short">("short");
  const [wAnswer, setWAnswer] = useState("");
  const [wScore, setWScore] = useState(10);
  const [options, setOptions] = useState<Opt[]>([
    { body: "", is_correct: true },
    { body: "", is_correct: false },
    { body: "", is_correct: false },
    { body: "", is_correct: false },
  ]);

  const { data: topics } = useQuery({
    queryKey: ["admin-topics-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("topics").select("id, title, category").order("title");
      return data ?? [];
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["admin-questions", topicId],
    queryFn: async () => {
      let q = supabase.from("questions").select("id, body, difficulty, topic_id, topics(title)").order("created_at", { ascending: false }).limit(50);
      if (topicId) q = q.eq("topic_id", topicId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: written } = useQuery({
    queryKey: ["admin-written", topicId],
    queryFn: async () => {
      let w = supabase
        .from("written_tasks")
        .select("id, body, mode, max_score, difficulty, topic_id, topics(title)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (topicId) w = w.eq("topic_id", topicId);
      const { data, error } = await w;
      if (error) throw error;
      return data ?? [];
    },
  });

  const createWritten = useMutation({
    mutationFn: async () => {
      if (!topicId) throw new Error("Mavzuni tanlang");
      if (wMode === "short" && !wAnswer.trim()) throw new Error("Qisqa javob uchun to'g'ri javobni kiriting");
      const { error } = await supabase.from("written_tasks").insert({
        topic_id: topicId,
        body,
        mode: wMode,
        expected_answer: wMode === "short" ? wAnswer : null,
        solution: explanation || null,
        image_url: imageUrl || null,
        max_score: wScore,
        difficulty: difficulty as "easy" | "medium" | "hard",
        sort_order: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Yozma ish qo'shildi");
      setBody(""); setExplanation(""); setImageUrl(""); setWAnswer("");
      qc.invalidateQueries({ queryKey: ["admin-written"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeWritten = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("written_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-written"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!topicId) throw new Error("Mavzuni tanlang");
      if (!options.some((o) => o.is_correct && o.body.trim())) throw new Error("Kamida bitta to'g'ri variant kerak");
      const cleanOpts = options.filter((o) => o.body.trim());
      if (cleanOpts.length < 2) throw new Error("Kamida 2 ta variant kerak");

      const { data: q, error: qErr } = await supabase.from("questions").insert({
        topic_id: topicId, body,
        difficulty: difficulty as "easy" | "medium" | "hard",
        section: section || null,
        explanation: explanation || null,
        image_url: imageUrl || null, sort_order: 0,
      }).select().single();
      if (qErr) throw qErr;

      const { error: oErr } = await supabase.from("question_options").insert(
        cleanOpts.map((o, i) => ({
          question_id: q.id, body: o.body, is_correct: o.is_correct, sort_order: i,
        })),
      );
      if (oErr) throw oErr;
    },
    onSuccess: () => {
      toast.success("Savol qo'shildi");
      setBody(""); setExplanation(""); setImageUrl("");
      setOptions([
        { body: "", is_correct: true },
        { body: "", is_correct: false },
        { body: "", is_correct: false },
        { body: "", is_correct: false },
      ]);
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Savollar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        LaTeX qo'llab-quvvatlanadi: <code className="rounded bg-secondary px-1">$x^2$</code> yoki <code className="rounded bg-secondary px-1">$$\int f$$</code>.
      </p>

      <div className="mt-5 inline-flex rounded-full border border-border bg-card p-1">
        {(["test", "written"] as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {k === "test" ? "Test savoli" : "Yozma ish"}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); (kind === "test" ? create : createWritten).mutate(); }}
        className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <select required value={topicId} onChange={(e) => setTopicId(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Mavzuni tanlang…</option>
            {(topics ?? []).map((t) => <option key={t.id} value={t.id}>{t.title} ({t.category})</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="easy">Oson</option>
            <option value="medium">O'rta</option>
            <option value="hard">Qiyin</option>
          </select>
        </div>
        <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Bo'lim: belgilanmagan</option>
          <option value="matematika">Matematika</option>
          <option value="kasbiy">Kasbiy standart</option>
          <option value="pedagogika">Pedagogik mahorat</option>
        </select>
        <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Savol matni (LaTeX bilan)" rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        {body && (
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Ko'rinishi</div>
            <LatexText>{body}</LatexText>
          </div>
        )}
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Rasm URL (ixtiyoriy)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />

        {kind === "test" ? (
          <div className="space-y-2">
            <div className="text-xs font-medium">Variantlar</div>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={o.is_correct}
                  onChange={() => setOptions(options.map((x, j) => ({ ...x, is_correct: j === i })))}
                  className="h-4 w-4 accent-brand"
                />
                <input
                  value={o.body}
                  onChange={(e) => setOptions(options.map((x, j) => j === i ? { ...x, body: e.target.value } : x))}
                  placeholder={`Variant ${i + 1}`}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground">Radio tugmasi — to'g'ri variantni belgilaydi.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Yozma ish turi
              <select value={wMode} onChange={(e) => setWMode(e.target.value as "open" | "short")} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <option value="short">Qisqa javob (avtomatik tekshiriladi)</option>
                <option value="open">Ochiq javob (qo'lda baholanadi)</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Maksimal ball
              <input type="number" min={1} max={100} value={wScore} onChange={(e) => setWScore(Number(e.target.value))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            {wMode === "short" && (
              <input
                value={wAnswer}
                onChange={(e) => setWAnswer(e.target.value)}
                placeholder="To'g'ri javob (masalan: 6sqrt2 yoki 12)"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              />
            )}
          </div>
        )}

        <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder={kind === "test" ? "Izoh (ixtiyoriy)" : "Namunaviy yechim (ixtiyoriy)"} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />

        <button disabled={create.isPending || createWritten.isPending} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground glow disabled:opacity-60">
          <Plus className="h-4 w-4" /> {kind === "test" ? "Savolni saqlash" : "Yozma ishni saqlash"}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Barcha mavzular</option>
          {(topics ?? []).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">Oxirgi 50 ta savol</span>
      </div>

      <div className="mt-4 space-y-3">
        {(questions ?? []).map((q) => {
          const topic = q.topics as { title: string } | null;
          return (
            <div key={q.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm"><LatexText>{q.body}</LatexText></div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {topic?.title} · {q.difficulty}
                </div>
              </div>
              <button onClick={() => confirm("O'chirilsinmi?") && remove.mutate(q.id)} className="inline-flex items-center rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {(questions ?? []).length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Savollar yo'q.</p>
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Yozma ishlar</h2>
      <div className="mt-4 space-y-3">
        {(written ?? []).map((w) => {
          const topic = w.topics as { title: string } | null;
          return (
            <div key={w.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm"><LatexText>{w.body}</LatexText></div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {topic?.title} · {w.mode === "short" ? "qisqa javob" : "ochiq javob"} · {w.max_score} ball
                </div>
              </div>
              <button onClick={() => confirm("O'chirilsinmi?") && removeWritten.mutate(w.id)} className="inline-flex items-center rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary" aria-label="O'chirish">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {(written ?? []).length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Yozma ishlar yo'q.</p>
        )}
      </div>
    </div>
  );
}

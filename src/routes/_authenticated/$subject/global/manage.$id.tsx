import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LatexText } from "@/components/latex-text";
import { AccessAlert } from "@/components/access-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Plus, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$subject/global/manage/$id")({
  head: () => ({
    meta: [
      { title: "Global testni tahrirlash — StartEdu" },
      { name: "description", content: "Global testga savol va variantlar qo'shing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManageGlobalTest,
});

type OptDraft = { body: string; is_correct: boolean };

function ManageGlobalTest() {
  const subject = useSubject();
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const [qBody, setQBody] = useState("");
  const [qImage, setQImage] = useState("");
  const [qExplanation, setQExplanation] = useState("");
  const [opts, setOpts] = useState<OptDraft[]>([
    { body: "", is_correct: true },
    { body: "", is_correct: false },
    { body: "", is_correct: false },
    { body: "", is_correct: false },
  ]);

  const test = useQuery({
    queryKey: ["global-test", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_tests")
        .select("id, code, title, description, duration_minutes, is_active")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Test topilmadi");
      return data;
    },
  });

  const questions = useQuery({
    queryKey: ["global-test-questions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_test_questions")
        .select("id, body, explanation, image_url, sort_order, global_test_options(id, body, is_correct, sort_order)")
        .eq("test_id", id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const results = useQuery({
    queryKey: ["global-test-results", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("global_test_results", { _test_id: id });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMeta = useMutation({
    mutationFn: async (patch: { title?: string; description?: string; duration_minutes?: number; is_active?: boolean }) => {
      const { error } = await supabase.from("global_tests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saqlandi");
      qc.invalidateQueries({ queryKey: ["global-test", id] });
      qc.invalidateQueries({ queryKey: ["global-my-tests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addQuestion = useMutation({
    mutationFn: async () => {
      const body = qBody.trim();
      if (body.length < 3) throw new Error("Savol matni juda qisqa");
      const filled = opts.filter((o) => o.body.trim().length > 0);
      if (filled.length < 2) throw new Error("Kamida 2 variant kiriting");
      if (!filled.some((o) => o.is_correct)) throw new Error("To'g'ri javobni belgilang");

      const nextOrder = (questions.data ?? []).length + 1;
      const { data: q, error } = await supabase
        .from("global_test_questions")
        .insert({
          test_id: id,
          body,
          explanation: qExplanation.trim() || null,
          image_url: qImage.trim() || null,
          sort_order: nextOrder,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: oErr } = await supabase.from("global_test_options").insert(
        filled.map((o, i) => ({
          question_id: q.id,
          body: o.body.trim(),
          is_correct: o.is_correct,
          sort_order: i + 1,
        })),
      );
      if (oErr) throw oErr;
    },
    onSuccess: () => {
      toast.success("Savol qo'shildi");
      setQBody("");
      setQImage("");
      setQExplanation("");
      setOpts([
        { body: "", is_correct: true },
        { body: "", is_correct: false },
        { body: "", is_correct: false },
        { body: "", is_correct: false },
      ]);
      qc.invalidateQueries({ queryKey: ["global-test-questions", id] });
      qc.invalidateQueries({ queryKey: ["global-my-tests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeQuestion = useMutation({
    mutationFn: async (qid: string) => {
      const { error } = await supabase.from("global_test_questions").delete().eq("id", qid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Savol o'chirildi");
      qc.invalidateQueries({ queryKey: ["global-test-questions", id] });
      qc.invalidateQueries({ queryKey: ["global-my-tests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (test.isLoading) return <Skeleton className="h-72 rounded-2xl" />;
  if (test.error) return <AccessAlert error={test.error} />;
  const t = test.data!;

  return (
    <div>
      <Link to="/$subject/global" params={{ subject }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Global
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-brand/10 px-3 py-1.5 font-mono text-lg font-semibold tracking-[0.3em] text-brand">
              {t.code}
            </span>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(t.code);
                toast.success("Kod nusxalandi");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"
            >
              Nusxalash
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
          <input
            defaultValue={t.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== t.title) saveMeta.mutate({ title: v });
            }}
            className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            type="number"
            min={1}
            max={300}
            defaultValue={t.duration_minutes}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v > 0 && v !== t.duration_minutes) saveMeta.mutate({ duration_minutes: Math.min(300, v) });
            }}
            className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={() => saveMeta.mutate({ is_active: !t.is_active })}
            className={`rounded-xl border px-4 py-2.5 text-sm ${
              t.is_active
                ? "border-foreground/40 text-foreground hover:bg-foreground/10"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.is_active ? "Faol" : "Faol emas"}
          </button>
        </div>
        <textarea
          defaultValue={t.description ?? ""}
          onBlur={(e) => saveMeta.mutate({ description: e.target.value.trim() })}
          placeholder="Test tavsifi (ixtiyoriy)"
          rows={2}
          className="mt-3 w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>

      {/* Add question */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-semibold">Yangi savol qo'shish</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          LaTeX qo'llab-quvvatlanadi: $x^2+1$ yoki $$\frac{"{a}"}{"{b}"}$$
        </p>
        <textarea
          value={qBody}
          onChange={(e) => setQBody(e.target.value)}
          rows={3}
          placeholder="Savol matni"
          className="mt-4 w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        {qBody.trim() && (
          <div className="mt-2 rounded-xl border border-border bg-background/40 p-3 text-sm">
            <LatexText>{qBody}</LatexText>
          </div>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={qImage}
            onChange={(e) => setQImage(e.target.value)}
            placeholder="Rasm havolasi (ixtiyoriy)"
            className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            value={qExplanation}
            onChange={(e) => setQExplanation(e.target.value)}
            placeholder="Izoh (ixtiyoriy)"
            className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>

        <div className="mt-4 space-y-2">
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpts((s) => s.map((x, j) => ({ ...x, is_correct: j === i })))}
                title="To'g'ri javob"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
                  o.is_correct ? "border-foreground/60 bg-foreground/15 text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                <Check className="h-4 w-4" />
              </button>
              <input
                value={o.body}
                onChange={(e) => setOpts((s) => s.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
                placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                className="flex-1 rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              {opts.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOpts((s) => s.filter((_, j) => j !== i))}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpts((s) => [...s, { body: "", is_correct: false }])}
            className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Variant qo'shish
          </button>
          <button
            onClick={() => addQuestion.mutate()}
            disabled={addQuestion.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground glow disabled:opacity-60"
          >
            {addQuestion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Savolni saqlash
          </button>
        </div>
      </div>

      {/* Question list */}
      <h2 className="mt-10 font-semibold">Savollar ({(questions.data ?? []).length})</h2>
      {questions.error && <AccessAlert error={questions.error} className="mt-4" />}
      <div className="mt-4 space-y-3">
        {(questions.data ?? []).map((q, idx) => (
          <div key={q.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-sm">
                <span className="mr-2 text-muted-foreground">{idx + 1}.</span>
                <LatexText>{q.body}</LatexText>
              </div>
              <button
                onClick={() => {
                  if (confirm("Savolni o'chirasizmi?")) removeQuestion.mutate(q.id);
                }}
                className="rounded-lg border border-destructive/40 p-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {[...(q.global_test_options ?? [])]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((o, oi) => (
                  <li
                    key={o.id}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      o.is_correct ? "border-foreground/40 bg-foreground/10 text-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="mr-1 font-semibold">{String.fromCharCode(65 + oi)}.</span>
                    <LatexText>{o.body}</LatexText>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Results */}
      <h2 className="mt-10 font-semibold">Natijalar</h2>
      {results.error && <AccessAlert error={results.error} className="mt-4" />}
      {(results.data ?? []).length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Hozircha bu testni hech kim ishlamagan.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Foydalanuvchi</th>
                <th className="px-4 py-3 text-left">Ball</th>
                <th className="px-4 py-3 text-left">To'g'ri</th>
                <th className="px-4 py-3 text-left">Vaqt</th>
                <th className="px-4 py-3 text-left">Sana</th>
              </tr>
            </thead>
            <tbody>
              {(results.data ?? []).map((r) => (
                <tr key={r.attempt_id} className="border-t border-border">
                  <td className="px-4 py-3">{r.full_name ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{r.score}%</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.correct_count}/{r.total_questions}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.time_spent_seconds != null ? `${Math.round(r.time_spent_seconds / 60)} daq` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.completed_at ? new Date(r.completed_at).toLocaleString("uz-UZ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

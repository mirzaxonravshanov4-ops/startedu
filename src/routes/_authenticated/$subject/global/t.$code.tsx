import { useSubject } from "@/lib/subject";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LatexText } from "@/components/latex-text";
import { AccessAlert } from "@/components/access-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useExamLock } from "@/hooks/use-exam-lock";
import {
  ExamStartScreen,
  ExamLockOverlay,
  ExamTopBar,
  ExamQuestionBar,
  ExamFinishDialog,
} from "@/components/exam-gate";

export const Route = createFileRoute("/_authenticated/$subject/global/t/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.code} — Global test` },
      { name: "description", content: "Maxsus kod orqali global testni ishlash." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GlobalTestRunner,
});

type Item = {
  question_id: string;
  body: string;
  image_url: string | null;
  sort_order: number;
  options: { id: string; body: string }[];
};

function GlobalTestRunner() {
  const subject = useSubject();
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const lock = useExamLock();

  const { data, isLoading, error } = useQuery({
    queryKey: ["global-run", code],
    queryFn: async () => {
      const [metaRes, itemsRes] = await Promise.all([
        supabase.rpc("global_test_by_code", { _code: code }),
        supabase.rpc("global_test_items_by_code", { _code: code }),
      ]);
      if (metaRes.error) throw metaRes.error;
      if (itemsRes.error) throw itemsRes.error;
      const meta = (metaRes.data ?? [])[0];
      if (!meta) throw new Error("Bunday kodli faol test topilmadi");
      const items = ((itemsRes.data ?? []) as unknown as Item[]).map((i) => ({
        ...i,
        options: (i.options ?? []) as { id: string; body: string }[],
      }));
      return { meta, items };
    },
  });

  const totalSec = (data?.meta?.duration_minutes ?? 0) * 60;

  useEffect(() => {
    if (!data || !lock.active) return;
    startedAtRef.current = Date.now();
    setRemaining(totalSec);
    const iv = setInterval(() => setRemaining((r) => (r == null ? r : r - 1)), 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.meta?.id, lock.active]);

  async function submitAttempt(auto = false) {
    if (submitting || !data) return;
    setSubmitting(true);
    try {
      const answers = data.items.map((q) => ({
        question_id: q.question_id,
        selected_option_id: selected[q.question_id] ?? null,
      }));
      const { data: attemptId, error: sErr } = await supabase.rpc("submit_global_test", {
        _code: code,
        _answers: answers,
        _time_spent_seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
      });
      if (sErr) throw sErr;
      lock.stop();
      toast[auto ? "message" : "success"](auto ? "Vaqt tugadi. Natija saqlandi" : "Natija saqlandi");
      navigate({ to: "/$subject/global/result/$attemptId", params: { subject, attemptId: attemptId as string } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (remaining == null) return;
    if (remaining <= 0 && !submittedRef.current) {
      submittedRef.current = true;
      void submitAttempt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const mmss = useMemo(() => {
    if (remaining == null) return "--:--";
    const m = Math.max(0, Math.floor(remaining / 60));
    const s = Math.max(0, remaining % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  if (isLoading) return <Skeleton className="h-72 rounded-2xl" />;
  if (error) return <AccessAlert error={error} />;
  if (!data) return null;

  if (data.items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">{data.meta.title}</h1>
        <p className="mt-3 text-muted-foreground">Bu testda hozircha savollar yo'q.</p>
        <Link to="/$subject/global" params={{ subject }} className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" /> Global
        </Link>
      </div>
    );
  }

  if (!lock.active) {
    return (
      <ExamStartScreen
        lock={lock}
        title={data.meta.title}
        description={data.meta.description}
        questionCount={data.items.length}
        durationMinutes={data.meta.duration_minutes}
        backTo={{ to: "/$subject/global", params: { subject }, label: "Global bo'limiga qaytish" }}
      />
    );
  }

  const q = data.items[current]!;
  const chosen = selected[q.question_id];
  const answered = Object.keys(selected).length;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-20">
      <ExamTopBar
        lock={lock}
        title={data.meta.title}
        time={mmss}
        lowTime={remaining != null && remaining <= 60}
        current={current + 1}
        total={data.items.length}
        answered={answered}
      />

      <ExamLockOverlay lock={lock} />
      <ExamFinishDialog
        open={confirmOpen}
        total={data.items.length}
        answered={answered}
        submitting={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void submitAttempt();
        }}
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="text-xs text-muted-foreground">
          Savol {current + 1} / {data.items.length}
        </div>
        <div className="mt-3 text-base">
          <LatexText>{q.body}</LatexText>
        </div>
        {q.image_url && (
          <img src={q.image_url} alt="Savol rasmi" loading="lazy" className="mt-4 max-h-72 rounded-xl border border-border bg-white p-2" />
        )}

        <div className="mt-5 space-y-2">
          {q.options.map((o, i) => (
            <button
              key={o.id}
              onClick={() => setSelected((s) => ({ ...s, [q.question_id]: o.id }))}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                chosen === o.id ? "border-brand/60 bg-brand/10" : "border-border hover:bg-secondary"
              }`}
            >
              <span className="font-semibold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
              <LatexText>{o.body}</LatexText>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Oldingi
        </button>
        <button
          onClick={() => setCurrent((c) => Math.min(data.items.length - 1, c + 1))}
          disabled={current === data.items.length - 1}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Keyingi <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <ExamQuestionBar
        total={data.items.length}
        current={current}
        isAnswered={(i) => !!selected[data.items[i]!.question_id]}
        onJump={setCurrent}
        onFinish={() => setConfirmOpen(true)}
        submitting={submitting}
      />
    </div>
  );
}

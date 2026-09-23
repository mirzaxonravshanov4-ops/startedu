import { useSubject } from "@/lib/subject";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LatexText } from "@/components/latex-text";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useExamLock } from "@/hooks/use-exam-lock";
import { examDurationMinutes } from "@/lib/exam-time";
import {
  ExamStartScreen,
  ExamLockOverlay,
  ExamTopBar,
  ExamQuestionBar,
  ExamFinishDialog,
} from "@/components/exam-gate";

export const Route = createFileRoute("/_authenticated/$subject/topics/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — StartEdu` },
      { name: "description", content: "Test topshirish sahifasi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TopicPage,
});

type Question = {
  id: string;
  body: string;
  explanation: string | null;
  difficulty: string;
  image_url: string | null;
  video_url: string | null;
  question_options: {
    id: string;
    body: string;
    sort_order: number;
  }[];
};

function TopicPage() {
  const subject = useSubject();
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);
  const lock = useExamLock();

  const { data, isLoading } = useQuery({
    queryKey: ["topic", slug],
    queryFn: async () => {
      const { data: topic, error: tErr } = await supabase
        .from("topics")
        .select("id, title, description, category")
        .eq("slug", slug)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!topic) throw new Error("Mavzu topilmadi");

      const { data: qs, error: qErr } = await supabase
        .from("questions")
        .select(
          "id, body, explanation, difficulty, image_url, video_url, question_options(id, body, sort_order)",
        )
        .eq("topic_id", topic.id)
        .order("sort_order", { ascending: true });
      if (qErr) throw qErr;
      const sorted = ((qs ?? []) as Question[]).map((q) => ({
        ...q,
        question_options: [...q.question_options].sort((a, b) => a.sort_order - b.sort_order),
      }));
      return { topic, questions: sorted };
    },
  });

  // Attestatsiya — 2 soat, qolganlari har bir savolga 1.5 daqiqa
  const durationMinutes = examDurationMinutes(data?.topic?.category, data?.questions.length ?? 0);

  useEffect(() => {
    if (!data || !lock.active) return;
    startedAtRef.current = Date.now();
    setRemaining(durationMinutes * 60);
    const iv = setInterval(() => setRemaining((r) => (r == null ? r : r - 1)), 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.topic?.id, lock.active]);

  useEffect(() => {
    if (remaining == null) return;
    if (remaining <= 0 && !submittedRef.current) {
      submittedRef.current = true;
      void submitAttempt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const mm = useMemo(() => {
    if (remaining == null) return "--:--";
    const m = Math.max(0, Math.floor(remaining / 60));
    const s = Math.max(0, remaining % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  async function submitAttempt(auto = false) {
    if (submitting || !data) return;
    setSubmitting(true);
    try {
      const answers = data.questions.map((qq) => ({
        question_id: qq.id,
        selected_option_id: selected[qq.id] ?? null,
      }));

      // Baholash serverda amalga oshiriladi (ball va XP soxtalashtirilmasligi uchun).
      const { data: attemptId, error } = await supabase.rpc("submit_test_attempt", {
        _topic_id: data.topic.id,
        _mock_exam_id: null as unknown as string,
        _answers: answers,
        _time_spent_seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
      });
      if (error) throw error;

      lock.stop();
      toast[auto ? "message" : "success"](
        auto ? "Vaqt tugadi. Natija saqlandi" : "Natija saqlandi",
      );
      navigate({ to: "/$subject/attempts/$id", params: { subject, id: attemptId as string } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik");
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (!data) return null;

  const { topic, questions } = data;

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{topic.title}</h1>
        <p className="mt-3 text-muted-foreground">
          Bu mavzuda hozircha savollar yo'q. Tez orada qo'shiladi.
        </p>
        <Link to="/$subject/topics" params={{ subject }}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" /> Testlarga qaytish
        </Link>
      </div>
    );
  }

  if (!lock.active) {
    return (
      <ExamStartScreen
        lock={lock}
        title={topic.title}
        description={topic.description}
        questionCount={questions.length}
        durationMinutes={durationMinutes}
        backTo={{ to: "/$subject/topics", params: { subject }, label: "Testlarga qaytish" }}
      />
    );
  }

  const q = questions[current]!;
  const chosenId = selected[q.id];
  const answeredCount = Object.keys(selected).length;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-20 sm:px-6">
      <ExamTopBar
        lock={lock}
        title={topic.title}
        time={mm}
        lowTime={remaining != null && remaining <= 60}
        current={current + 1}
        total={questions.length}
        answered={answeredCount}
      />
      <ExamLockOverlay lock={lock} />
      <ExamFinishDialog
        open={confirmOpen}
        total={questions.length}
        answered={answeredCount}
        submitting={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void submitAttempt(false);
        }}
      />

      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs text-muted-foreground">
          Savol {current + 1} / {questions.length}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-0.5">{q.difficulty}</span>
        </div>
        <div className="mt-4 text-lg leading-relaxed">
          <LatexText>{q.body}</LatexText>
        </div>
        {q.image_url && (
          <img
            src={q.image_url}
            alt="Savol rasmi"
            className="mt-4 max-h-80 rounded-xl border border-border"
          />
        )}

        <div className="mt-6 space-y-2">
          {q.question_options.map((opt) => {
            const isSel = chosenId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [q.id]: opt.id }))}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  isSel
                    ? "border-brand bg-brand/10"
                    : "border-border hover:border-brand/50 hover:bg-secondary"
                }`}
              >
                <span className="flex-1">
                  <LatexText>{opt.body}</LatexText>
                </span>
              </button>
            );
          })}
        </div>
      </article>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Oldingi
        </button>
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
          disabled={current === questions.length - 1}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Keyingi <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <ExamQuestionBar
        total={questions.length}
        current={current}
        isAnswered={(i) => !!selected[questions[i]!.id]}
        onJump={setCurrent}
        onFinish={() => setConfirmOpen(true)}
        submitting={submitting}
      />
    </div>
  );
}

import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LatexText } from "@/components/latex-text";
import { ArrowLeft, CheckCircle2, Trophy, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$subject/attempts/$id")({
  head: () => ({
    meta: [
      { title: "Natija — StartEdu" },
      { name: "description", content: "Test natijalari." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AttemptPage,
});

function AttemptPage() {
  const subject = useSubject();
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["attempt", id],
    queryFn: async () => {
      const { data: attempt, error: aErr } = await supabase
        .from("test_attempts")
        .select("id, score, total_questions, correct_count, completed_at, topic_id, topics(slug, title)")
        .eq("id", id)
        .maybeSingle();
      if (aErr) throw aErr;
      if (!attempt) throw new Error("Urinish topilmadi");

      const { data: answers, error: ansErr } = await supabase
        .from("test_answers")
        .select(
          "id, is_correct, selected_option_id, questions(id, body, explanation), question_options:selected_option_id(body)",
        )
        .eq("attempt_id", id);
      if (ansErr) throw ansErr;

      return { attempt, answers: answers ?? [] };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  const { attempt, answers } = data;
  const topic = attempt.topics as { slug: string; title: string } | null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/$subject/dashboard" params={{ subject }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Panel
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary glow">
          <Trophy className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="mt-5 text-4xl font-bold gradient-text">{attempt.score}<span className="text-xl text-muted-foreground">/100</span></h1>
        {topic && <p className="mt-2 text-sm text-muted-foreground">{topic.title}</p>}
        <div className="mt-4 text-sm">
          To'g'ri: <strong>{attempt.correct_count}</strong> / {attempt.total_questions}
        </div>
        {topic && (
          <Link
            to="/$subject/topics/$slug"
            params={{ subject, slug: topic.slug }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground glow"
          >
            Qayta topshirish
          </Link>
        )}
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">Javoblar tahlili</h2>
        {answers.map((a, i) => {
          const q = a.questions as { body: string; explanation: string | null } | null;
          const selOpt = a.question_options as { body: string } | null;
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-medium ${a.is_correct ? "bg-foreground/20 text-foreground" : "bg-foreground/20 text-foreground"}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {q && <div className="text-sm leading-relaxed"><LatexText>{q.body}</LatexText></div>}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {a.is_correct ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-foreground" /> To'g'ri</>
                    ) : (
                      <><XCircle className="h-3.5 w-3.5 text-foreground" /> Noto'g'ri</>
                    )}
                  </div>
                  {selOpt && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Sizning javobingiz: <LatexText>{selOpt.body}</LatexText>
                    </div>
                  )}
                  {q?.explanation && (
                    <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                      <LatexText>{q.explanation}</LatexText>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccessAlert } from "@/components/access-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$subject/global/result/$attemptId")({
  head: () => ({
    meta: [
      { title: "Global test natijasi — StartEdu" },
      { name: "description", content: "Global test natijangiz." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GlobalResult,
});

function GlobalResult() {
  const subject = useSubject();
  const { attemptId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["global-attempt", attemptId],
    queryFn: async () => {
      const { data: a, error: aErr } = await supabase
        .from("global_test_attempts")
        .select("id, score, correct_count, total_questions, time_spent_seconds, completed_at, global_tests(title, code)")
        .eq("id", attemptId)
        .maybeSingle();
      if (aErr) throw aErr;
      if (!a) throw new Error("Natija topilmadi");
      return a;
    },
  });

  if (isLoading) return <Skeleton className="h-60 rounded-2xl" />;
  if (error) return <AccessAlert error={error} />;
  if (!data) return null;

  const test = data.global_tests as unknown as { title: string; code: string } | null;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary glow">
        <Trophy className="h-6 w-6 text-primary-foreground" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{test?.title ?? "Global test"}</h1>
      {test?.code && (
        <p className="mt-1 text-xs text-muted-foreground">
          Kod: <span className="font-mono tracking-widest">{test.code}</span>
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { l: "Ball", v: `${data.score}%` },
          { l: "To'g'ri javoblar", v: `${data.correct_count}/${data.total_questions}` },
          {
            l: "Sarflangan vaqt",
            v: data.time_spent_seconds != null ? `${Math.round(data.time_spent_seconds / 60)} daq` : "—",
          },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-2xl font-bold gradient-text">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      <Link to="/$subject/global" params={{ subject }}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
      >
        <ArrowLeft className="h-4 w-4" /> Global bo'limiga qaytish
      </Link>
    </div>
  );
}

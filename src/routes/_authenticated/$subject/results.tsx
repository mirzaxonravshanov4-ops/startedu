import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, ChevronRight, Target, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/$subject/results")({
  head: () => ({
    meta: [
      { title: "Natijalarim — StartEdu" },
      { name: "description", content: "Ishlagan testlaringiz natijalari va tahlili." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const subject = useSubject();
  const { data, isLoading } = useQuery({
    queryKey: ["my-results"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("test_attempts")
        .select("id, score, correct_count, total_questions, completed_at, topics(title)")
        .eq("user_id", uid)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = data ?? [];
  const avg = rows.length
    ? Math.round(rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length)
    : 0;
  const best = rows.reduce((m, r) => Math.max(m, r.score ?? 0), 0);

  const stats = [
    { l: "Ishlangan testlar", v: rows.length, i: BarChart3 },
    { l: "O'rtacha natija", v: `${avg}%`, i: TrendingUp },
    { l: "Eng yaxshi natija", v: `${best}%`, i: Target },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-brand">Shaxsiy</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Natijalarim</h1>
        <p className="mt-3 text-muted-foreground">
          Barcha urinishlaringiz tarixi va batafsil tahlili.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl glass">
              <s.i className="h-5 w-5 text-brand" />
            </span>
            <div className="mt-4 text-3xl font-bold gradient-text">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </section>

      {isLoading ? (
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      ) : rows.length ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Test</th>
                <th className="px-4 py-3 text-right">To'g'ri</th>
                <th className="px-4 py-3 text-right">Ball</th>
                <th className="px-4 py-3 text-right">Sana</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    {r.topics?.title ?? "Test"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {r.correct_count}/{r.total_questions}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        (r.score ?? 0) >= 80
                          ? "bg-brand/15 text-brand"
                          : (r.score ?? 0) >= 50
                            ? "bg-secondary text-foreground"
                            : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {r.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {r.completed_at ? new Date(r.completed_at).toLocaleDateString("uz-UZ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/$subject/attempts/$id"
                      params={{ subject, id: r.id }}
                      className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                    >
                      Tahlil <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          Hozircha natijalar yo'q. Birinchi testni ishlang!
        </p>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, ChevronRight, Loader2, Users, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/results")({
  head: () => ({
    meta: [
      { title: "Test natijalari — Admin | StartEdu" },
      { name: "description", content: "Har bir test bo'yicha o'quvchilar natijalari va statistikasi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminResults,
});

type Overview = {
  id: string;
  kind: string;
  title: string;
  attempts: number;
  avg_score: number;
  best_score: number;
  last_attempt: string | null;
};

function AdminResults() {
  const [selected, setSelected] = useState<Overview | null>(null);

  const { data: tests, isLoading } = useQuery({
    queryKey: ["admin-test-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_test_overview");
      if (error) throw error;
      return (data ?? []) as Overview[];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary glow">
          <BarChart3 className="h-5 w-5 text-primary-foreground" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Test natijalari</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Testni tanlang — barcha o'quvchilarning ballari, to'g'ri javoblari va sarflagan vaqti ko'rinadi.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 grid h-40 place-items-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {!isLoading && !(tests ?? []).length && (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          Hozircha yakunlangan test urinishlari yo'q.
        </p>
      )}

      {!!(tests ?? []).length && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden grid-cols-[1fr_90px_90px_90px_150px_32px] gap-3 border-b border-border px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground sm:grid">
            <span>Test</span>
            <span>Urinish</span>
            <span>O'rtacha</span>
            <span>Eng yaxshi</span>
            <span>Oxirgi urinish</span>
            <span />
          </div>
          {(tests ?? []).map((t) => (
            <button
              key={`${t.kind}-${t.id}`}
              onClick={() => setSelected(t)}
              className="grid w-full grid-cols-2 items-center gap-3 border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-secondary sm:grid-cols-[1fr_90px_90px_90px_150px_32px]"
            >
              <span className="col-span-2 min-w-0 sm:col-span-1">
                <span className="block truncate font-medium">{t.title}</span>
                <span className="text-xs text-muted-foreground">
                  Mavzu testi
                </span>
              </span>
              <span>{t.attempts}</span>
              <span>{Math.round(Number(t.avg_score ?? 0))}%</span>
              <span>{Math.round(Number(t.best_score ?? 0))}%</span>
              <span className="text-xs text-muted-foreground">
                {t.last_attempt ? new Date(t.last_attempt).toLocaleString("uz-UZ") : "—"}
              </span>
              <ChevronRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </button>
          ))}
        </div>
      )}

      {selected && <ResultsPanel test={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

type ResultRow = {
  attempt_id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  score: number;
  correct_count: number;
  total_questions: number;
  time_spent_seconds: number | null;
  completed_at: string | null;
  created_at: string;
};

function ResultsPanel({ test, onClose }: { test: Overview; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-test-results", test.kind, test.id],
    queryFn: async () => {
      const args = { _topic_id: test.id };
      const { data, error } = await supabase.rpc("admin_test_results", args);
      if (error) throw error;
      return (data ?? []) as ResultRow[];
    },
  });

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-brand" /> {test.title}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {test.attempts} urinish • o'rtacha {Math.round(Number(test.avg_score ?? 0))}%
          </p>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
          aria-label="Yopish"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="mt-4 grid h-24 place-items-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {!isLoading && !(data ?? []).length && (
        <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Bu test bo'yicha natija yo'q.
        </p>
      )}

      {!!(data ?? []).length && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">O'quvchi</th>
                <th className="py-2 pr-3">Ball</th>
                <th className="py-2 pr-3">To'g'ri</th>
                <th className="py-2 pr-3">Vaqt</th>
                <th className="py-2">Sana</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r, i) => (
                <tr key={r.attempt_id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <span className="block truncate font-medium">{r.full_name ?? "O'quvchi"}</span>
                    {r.username && <span className="text-xs text-muted-foreground">@{r.username}</span>}
                  </td>
                  <td className="py-2 pr-3 font-medium">{Math.round(Number(r.score ?? 0))}%</td>
                  <td className="py-2 pr-3">
                    {r.correct_count}/{r.total_questions}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {r.time_spent_seconds ? `${Math.round(r.time_spent_seconds / 60)} daq` : "—"}
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {new Date(r.completed_at ?? r.created_at).toLocaleString("uz-UZ")}
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

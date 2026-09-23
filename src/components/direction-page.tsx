import { useSubject } from "@/lib/subject";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Clock, Play, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { examDurationMinutes } from "@/lib/exam-time";

import type { Database } from "@/integrations/supabase/types";

type TopicCategory = Database["public"]["Enums"]["topic_category"];

type Props = {
  /** matches topics.category */
  category: TopicCategory | TopicCategory[];
  eyebrow: string;
  title: string;
  description: string;
};

/** Har bir yo'nalish sahifasi — mavzulashtirilgan testlar ko'rinishida. */
export function DirectionPage({ category, eyebrow, title, description }: Props) {
  const subject = useSubject();
  const cats = Array.isArray(category) ? category : [category];
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["direction", cats.join(",")],
    queryFn: async () => {
      const { data: topics, error } = await supabase
        .from("topics")
        .select("id, slug, title, description, category, questions(count)")
        .in("category", cats)
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return (topics ?? []).map((t) => ({
        ...t,
        count: (t.questions as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
      }));
    },
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = (data ?? []).filter((t) => t.count > 0);
    if (!needle) return list;
    return list.filter((t) => t.title.toLowerCase().includes(needle));
  }, [data, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-brand">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{description}</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mavzu qidirish..."
            aria-label="Mavzu qidirish"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Link
              key={t.id}
              to="/$subject/topics/$slug"
              params={{ subject, slug: t.slug }}
              className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:border-brand/50"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl glass">
                  <BookOpen className="h-5 w-5 text-brand" />
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.count} savol
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{t.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {examDurationMinutes(t.category, t.count)} daqiqa
                </span>
                <span className="inline-flex items-center gap-1 text-brand">
                  <Play className="h-3.5 w-3.5" /> Boshlash
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Bu yo'nalish bo'yicha testlar hozircha qo'shilmagan. Tez orada qo'shiladi.
          </p>
          <Link to="/$subject/topics" params={{ subject }}
            className="mt-4 inline-flex rounded-full border border-border px-4 py-2 text-xs hover:bg-secondary"
          >
            Barcha testlar
          </Link>
        </div>
      )}
    </div>
  );
}

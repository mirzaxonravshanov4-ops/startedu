import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["mavzulashtirilgan", "algebra", "geometriya", "boshqa"] as const;

export const Route = createFileRoute("/_authenticated/$subject/topics/")({
  head: () => ({
    meta: [
      { title: "Mavzulashtirilgan testlar — StartEdu" },
      {
        name: "description",
        content: "Matematika mavzulari bo'yicha tartiblangan testlar to'plami.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TopicsPage,
});

function TopicsPage() {
  const subject = useSubject();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["topic-tests"],
    queryFn: async () => {
      const { data: topics, error } = await supabase
        .from("topics")
        .select("id, slug, title, description, category, questions(count)")
        .in("category", [...CATEGORIES])
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
          <p className="text-xs uppercase tracking-widest text-brand">Yo'nalish</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Mavzulashtirilgan testlar
          </h1>
          <p className="mt-3 text-muted-foreground">
            Har bir mavzu bo'yicha alohida test. Mavzuni tanlang va bilimingizni mustahkamlang.
          </p>
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
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-brand">
                <Play className="h-3.5 w-3.5" /> Boshlash
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          Mavzu topilmadi.
        </p>
      )}
    </div>
  );
}

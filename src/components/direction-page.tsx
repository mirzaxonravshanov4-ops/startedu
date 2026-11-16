import { useSubject } from "@/lib/subject";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Play } from "lucide-react";
import { examDurationMinutes } from "@/lib/exam-time";
import { DIRECTIONS } from "@/lib/directions";
import { CourseCatalog, isProModule, type CatalogCourse } from "@/components/course-catalog";
import type { Database } from "@/integrations/supabase/types";

type TopicCategory = Database["public"]["Enums"]["topic_category"];

type Props = {
  category: TopicCategory | TopicCategory[];
  eyebrow: string;
  title: string;
  description: string;
};

/** Har bir yo'nalish — TestMe uslubidagi modullar (Bepul / Pro). */
export function DirectionPage({ category, eyebrow, title, description }: Props) {
  const subject = useSubject();
  const cats = Array.isArray(category) ? category : [category];
  const dirKeys = DIRECTIONS.filter((d) => d.categories.some((c) => cats.includes(c))).map((d) => d.key);

  const { data, isLoading } = useQuery({
    queryKey: ["direction-modules", cats.join(",")],
    queryFn: async (): Promise<CatalogCourse[]> => {
      const [{ data: topics, error }, { data: modules }] = await Promise.all([
        supabase
          .from("topics")
          .select("id, slug, title, description, category, module_id, questions(count)")
          .in("category", cats)
          .eq("is_published", true)
          .order("sort_order"),
        supabase
          .from("modules")
          .select("id, slug, title, description, direction")
          .in("direction", dirKeys.length ? dirKeys : cats)
          .eq("is_published", true)
          .order("sort_order"),
      ]);
      if (error) throw error;
      const list = (topics ?? [])
        .map((t) => ({ ...t, count: (t.questions as unknown as { count: number }[] | null)?.[0]?.count ?? 0 }))
        .filter((t) => t.count > 0);
      const node = (t: (typeof list)[number]) => (
        <Link to="/$subject/topics/$slug" params={{ subject, slug: t.slug }}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/60">
          <div>
            <div className="font-semibold">{t.title}</div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{t.count} savol</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {examDurationMinutes(t.category, t.count)} daqiqa</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><Play className="h-4 w-4" /> Boshlash</span>
        </Link>
      );
      const courses: CatalogCourse[] = (modules ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        isPro: isProModule(m),
        itemLabel: "test",
        items: list.filter((t) => t.module_id === m.id).map((t) => ({ id: t.id, node: node(t) })),
      }));
      const known = new Set(courses.map((c) => c.id));
      const loose = list.filter((t) => !t.module_id || !known.has(t.module_id));
      if (loose.length)
        courses.push({ id: "general", title: `${title} — umumiy`, description, isPro: false, itemLabel: "test",
          items: loose.map((t) => ({ id: t.id, node: node(t) })) });
      return courses;
    },
  });

  return (
    <CourseCatalog eyebrow={eyebrow} title={title} description={description} badge="Modullar"
      courses={data} isLoading={isLoading} emptyText="Bu yo'nalish bo'yicha modullar hozircha qo'shilmagan." />
  );
}

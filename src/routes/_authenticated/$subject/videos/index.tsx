import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, FileText, PlayCircle } from "lucide-react";
import { CourseCatalog, isProModule, type CatalogCourse } from "@/components/course-catalog";

export const Route = createFileRoute("/_authenticated/$subject/videos/")({
  head: () => ({
    meta: [
      { title: "Kurslar — StartEdu" },
      { name: "description", content: "Bepul va Pro kurslar: bosqichma-bosqich darslar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const subject = useSubject();
  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<CatalogCourse[]> => {
      const [{ data: lessons, error }, { data: modules }] = await Promise.all([
        supabase.from("video_lessons")
          .select("id, title, description, module_id, duration_seconds, pdf_url, thumbnail_url")
          .eq("is_published", true).order("sort_order"),
        supabase.from("modules").select("id, slug, title, description")
          .eq("direction", "video").eq("is_published", true).order("sort_order"),
      ]);
      if (error) throw error;
      const node = (v: NonNullable<typeof lessons>[number], i: number) => (
        <Link to="/$subject/videos/$id" params={{ subject, id: v.id }}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-brand/60">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand/10 font-bold text-brand">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{v.title}</div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              {v.duration_seconds ? <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round(v.duration_seconds / 60)} daq</span> : null}
              {v.pdf_url && <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> PDF</span>}
            </div>
          </div>
          <PlayCircle className="h-6 w-6 text-brand" />
        </Link>
      );
      const all = lessons ?? [];
      const courses: CatalogCourse[] = (modules ?? []).map((m) => ({
        id: m.id, title: m.title, description: m.description, isPro: isProModule(m), itemLabel: "dars",
        items: all.filter((v) => v.module_id === m.id).map((v, i) => ({ id: v.id, node: node(v, i) })),
      }));
      const known = new Set(courses.map((c) => c.id));
      const loose = all.filter((v) => !v.module_id || !known.has(v.module_id));
      if (loose.length)
        courses.push({ id: "general", title: "Umumiy darslar", description: "Turli mavzulardagi darslar.", isPro: false,
          itemLabel: "dars", items: loose.map((v, i) => ({ id: v.id, node: node(v, i) })) });
      return courses;
    },
  });

  return (
    <CourseCatalog eyebrow="Har bir dars — yangi imkoniyat" title="O'rganishga vaqt ajrating."
      description="Qiziqishingizni bilimga aylantiring. Sizga mos kursni tanlang va o'z sur'atingizda o'rganing."
      badge="Kurslar" courses={data} isLoading={isLoading} emptyText="Hozircha bepul kurslar qo'shilmagan." />
  );
}

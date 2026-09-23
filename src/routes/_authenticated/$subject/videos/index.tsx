import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$subject/videos/")({
  head: () => ({
    meta: [
      { title: "Video darslar — StartEdu" },
      { name: "description", content: "Fan va mavzu bo'yicha tartiblangan video darslar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const subject = useSubject();
  const { data, isLoading } = useQuery({
    queryKey: ["video-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_lessons")
        .select("id, title, description, subject, duration_seconds, pdf_url, thumbnail_url, topics(title)")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  type Video = NonNullable<typeof data>[number];
  const grouped = (data ?? []).reduce<Record<string, Video[]>>((acc, v) => {
    (acc[v.subject ?? "Matematika"] ??= []).push(v);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-brand">Video kutubxona</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Video darslar</h1>
        <p className="mt-3 text-muted-foreground">
          Fan va mavzu bo'yicha tartiblangan darslar. Har bir dars oxirida shu mavzu bo'yicha test ishlash mumkin.
        </p>
      </header>

      {isLoading && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {!isLoading && (data ?? []).length === 0 && (
        <p className="mt-10 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Hozircha video darslar qo'shilmagan.
        </p>
      )}

      {Object.entries(grouped).map(([subject, items]) => (
        <section key={subject} className="mt-10">
          <h2 className="text-lg font-semibold">{subject}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => (
              <Link
                key={v.id}
                to="/$subject/videos/$id"
                params={{ subject, id: v.id }}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-brand/50"
              >
                <div className="relative grid h-36 place-items-center bg-primary/10">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.title} className="h-36 w-full object-cover" />
                  ) : (
                    <PlayCircle className="h-10 w-10 text-brand" />
                  )}
                </div>
                <div className="p-4">
                  <div className="font-medium leading-snug">{v.title}</div>
                  {v.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {v.topics?.title && <span>{v.topics.title}</span>}
                    {v.duration_seconds ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {Math.round(v.duration_seconds / 60)} daq
                      </span>
                    ) : null}
                    {v.pdf_url && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" /> PDF
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

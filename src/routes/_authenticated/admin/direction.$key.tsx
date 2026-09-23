import { useSubject } from "@/lib/subject";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDirection } from "@/lib/directions";

export const Route = createFileRoute("/_authenticated/admin/direction/$key")({
  head: () => ({ meta: [{ title: "Yo'nalish — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminDirection,
});

function AdminDirection() {
  const subject = useSubject();
  const { key } = Route.useParams();
  const dir = getDirection(key);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"tests" | "modules">("tests");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-direction", key],
    enabled: !!dir,
    queryFn: async () => {
      const cats = dir!.categories;
      const [topics, modules, videos] = await Promise.all([
        cats.length
          ? supabase
              .from("topics")
              .select("id, slug, title, category, is_published, sort_order, module_id, questions(count)")
              .in("category", cats)
              .order("sort_order")
          : Promise.resolve({ data: [] as never[] }),
        supabase.from("modules").select("id, title, slug, is_published, topics(count)").eq("direction", key).order("sort_order"),
        dir!.videos
          ? supabase.from("video_lessons").select("id, title, is_published, duration_seconds").order("sort_order")
          : Promise.resolve({ data: [] as never[] }),
      ]);
      return {
        topics: topics.data ?? [],
        modules: modules.data ?? [],
        videos: videos.data ?? [],
      };
    },
  });

  const removeTopic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-direction", key] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!dir) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Yo'nalish topilmadi.{" "}
        <Link to="/admin" className="text-brand hover:underline">
          Admin panelga qaytish
        </Link>
      </div>
    );
  }

  const needle = q.trim().toLowerCase();
  const topics = data?.topics.filter((t) => t.title.toLowerCase().includes(needle)) ?? [];
  const videos = data?.videos.filter((v) => v.title.toLowerCase().includes(needle)) ?? [];
  const modules = data?.modules.filter((m) => m.title.toLowerCase().includes(needle)) ?? [];

  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors";

  return (
    <div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border hover:bg-secondary"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{dir.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Testlarni boshqarish va tahrirlash</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link
          to="/admin/users"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm hover:bg-secondary"
        >
          <Users className="h-4 w-4" /> Foydalanuvchilar
        </Link>
        <Link
          to={dir.videos ? "/admin/videos" : "/admin/topics"}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground glow"
        >
          <Plus className="h-4 w-4" /> {dir.videos ? "Yangi video" : "Yangi test"}
        </Link>
      </div>

      <div className="mt-6 flex gap-6 border-b border-border">
        {(
          [
            ["tests", dir.videos ? "Videolar" : "Testlar"],
            ["modules", "Modullar"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm transition-colors ${
              tab === v
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === "tests" ? "Testlarni qidirish..." : "Modullarni qidirish..."}
          className="w-full rounded-2xl border border-border bg-background/50 py-3 pl-11 pr-4 text-sm outline-none focus:border-brand"
        />
      </div>

      {isLoading && (
        <div className="mt-5 grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && tab === "tests" && (
        <div className="mt-5 grid gap-3">
          {topics.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <h3 className="truncate font-semibold">{t.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    t.is_published ? "bg-foreground/10 text-foreground" : "bg-secondary"
                  }`}
                >
                  {t.is_published ? "OCHIQ" : "YOPIQ"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                  <Layers className="h-3.5 w-3.5" /> {t.category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> {t.questions?.[0]?.count ?? 0} ta savol
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link to="/$subject/topics/$slug" params={{ subject, slug: t.slug }} className={`${btn} bg-secondary hover:bg-secondary/70`}>
                  Ko'rish
                </Link>
                <Link to="/admin/questions" className={`${btn} bg-foreground/10 text-foreground hover:bg-foreground/20`}>
                  Savollar
                </Link>
                <Link to="/admin/topics" className={`${btn} bg-foreground/10 text-foreground hover:bg-foreground/20`}>
                  <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                </Link>
                <button
                  onClick={() => confirm("Mavzu o'chirilsinmi?") && removeTopic.mutate(t.id)}
                  className={`${btn} bg-destructive/10 text-destructive hover:bg-destructive/20`}
                >
                  <Trash2 className="h-3.5 w-3.5" /> O'chirish
                </button>
              </div>
            </div>
          ))}

          {videos.map((v) => (
            <div key={v.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <h3 className="truncate font-semibold">{v.title}</h3>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {v.is_published ? "OCHIQ" : "YOPIQ"} ·{" "}
                {Math.round((v.duration_seconds ?? 0) / 60)} daqiqa
              </div>
              <Link to="/admin/videos" className={`${btn} mt-4 w-full bg-secondary hover:bg-secondary/70`}>
                <Pencil className="h-3.5 w-3.5" /> Tahrirlash
              </Link>
            </div>
          ))}

          {!topics.length && !videos.length && (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Hozircha material yo'q.
            </p>
          )}
        </div>
      )}

      {!isLoading && tab === "modules" && (
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">Modullar — testlarni guruhlaydigan to'plamlar.</p>
          <Link
            to="/admin/modules"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground glow"
          >
            <Plus className="h-4 w-4" /> Yangi modul
          </Link>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {modules.map((m) => (
              <Link
                key={m.id}
                to="/admin/modules"
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-brand/50"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold">{m.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {m.topics?.[0]?.count ?? 0} ta test
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand" />
              </Link>
            ))}
            {!modules.length && (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Modullar yo'q.
              </p>
            )}
          </div>
        </div>
      )}

      <Link
        to="/admin/modules"
        className="mt-8 inline-flex items-center gap-1 text-xs text-brand hover:underline"
      >
        Barcha modullar <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

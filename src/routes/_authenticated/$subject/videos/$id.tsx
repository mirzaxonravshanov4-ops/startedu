import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, FileText, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$subject/videos/$id")({
  head: () => ({
    meta: [
      { title: "Video dars — StartEdu" },
      { name: "description", content: "Video darsni tomosha qiling va mavzu bo'yicha test ishlang." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VideoPage,
});

function VideoPage() {
  const subject = useSubject();
  const { id } = Route.useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);

  const { data, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const { data: video, error } = await supabase
        .from("video_lessons")
        .select("*, topics(slug, title)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      let progress: { seconds_watched: number; completed: boolean } | null = null;
      if (uid) {
        const { data: p } = await supabase
          .from("video_progress")
          .select("seconds_watched, completed")
          .eq("video_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        progress = p;
      }
      return { video, progress, uid };
    },
  });

  const saveProgress = useMutation({
    mutationFn: async (payload: { seconds: number; completed: boolean }) => {
      const uid = data?.uid;
      if (!uid) return;
      await supabase.from("video_progress").upsert(
        {
          user_id: uid,
          video_id: id,
          seconds_watched: Math.round(payload.seconds),
          completed: payload.completed,
        },
        { onConflict: "user_id,video_id" },
      );
    },
  });

  useEffect(() => {
    const el = videoRef.current;
    if (el && data?.progress?.seconds_watched) {
      el.currentTime = data.progress.seconds_watched;
    }
  }, [data?.progress?.seconds_watched]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-72 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  const video = data?.video;
  if (!video) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Video topilmadi.</p>
        <Link to="/$subject/videos" params={{ subject }} className="mt-4 inline-block text-sm text-brand hover:underline">
          Video darslarga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link to="/$subject/videos" params={{ subject }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Video darslar
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-black">
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.thumbnail_url ?? undefined}
          controls
          playsInline
          className="aspect-video w-full"
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            if (t - lastSaved.current > 10) {
              lastSaved.current = t;
              saveProgress.mutate({ seconds: t, completed: false });
            }
          }}
          onEnded={(e) => saveProgress.mutate({ seconds: e.currentTarget.currentTime, completed: true })}
        />
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight">{video.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{video.subject}</span>
        {video.topics?.title && <span>• {video.topics.title}</span>}
        {data?.progress?.completed && (
          <span className="inline-flex items-center gap-1 text-brand">
            <CheckCircle2 className="h-3.5 w-3.5" /> Ko'rilgan
          </span>
        )}
      </div>
      {video.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {video.description}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {video.pdf_url && (
          <a
            href={video.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-secondary"
          >
            <FileText className="h-4 w-4" /> Qo'shimcha material (PDF)
          </a>
        )}
        {video.topics?.slug && (
          <Link
            to="/$subject/topics/$slug"
            params={{ subject, slug: video.topics.slug }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground glow"
          >
            <ListChecks className="h-4 w-4" /> Shu mavzu bo'yicha test ishlash
          </Link>
        )}
      </div>
    </div>
  );
}

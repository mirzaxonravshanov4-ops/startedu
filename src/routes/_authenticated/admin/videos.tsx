import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Video as VideoIcon, Pencil, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/videos")({
  head: () => ({
    meta: [
      { title: "Video darslarni boshqarish — StartEdu" },
      { name: "description", content: "StartEdu video darslari va ularga tegishli materiallarni boshqarish sahifasi." },
      { property: "og:title", content: "Video darslarni boshqarish — StartEdu" },
      { property: "og:description", content: "StartEdu video darslari va ularga tegishli materiallarni boshqarish sahifasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVideos,
});

type Form = {
  id?: string;
  title: string;
  description: string;
  subject: string;
  topic_id: string;
  video_url: string;
  thumbnail_url: string;
  pdf_url: string;
  duration_seconds: string;
  is_published: boolean;
};

const EMPTY: Form = {
  title: "",
  description: "",
  subject: "Matematika",
  topic_id: "",
  video_url: "",
  thumbnail_url: "",
  pdf_url: "",
  duration_seconds: "",
  is_published: true,
};

function AdminVideos() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const { data: topics } = useQuery({
    queryKey: ["admin-topics-min"],
    queryFn: async () => {
      const { data } = await supabase.from("topics").select("id, title").order("title");
      return data ?? [];
    },
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_lessons")
        .select("*, topics(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (f: Form) => {
      if (!f.title.trim() || !f.video_url.trim()) throw new Error("Sarlavha va video havolasi majburiy");
      const payload = {
        title: f.title.trim(),
        description: f.description.trim() || null,
        subject: f.subject.trim() || "Matematika",
        topic_id: f.topic_id || null,
        video_url: f.video_url.trim(),
        thumbnail_url: f.thumbnail_url.trim() || null,
        pdf_url: f.pdf_url.trim() || null,
        duration_seconds: f.duration_seconds ? Number(f.duration_seconds) : null,
        is_published: f.is_published,
      };
      const res = f.id
        ? await supabase.from("video_lessons").update(payload).eq("id", f.id)
        : await supabase.from("video_lessons").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Saqlandi");
      setForm(EMPTY);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("video_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video darslar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            MP4 yoki boshqa to'g'ridan-to'g'ri video havolasini qo'shing.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY);
            setShowForm((s) => !s);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground glow"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Yopish" : "Yangi video"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
        >
          <Input label="Sarlavha *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Input label="Fan" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Tavsif</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <Input
            label="Video havolasi (MP4 / URL) *"
            value={form.video_url}
            onChange={(v) => setForm({ ...form, video_url: v })}
          />
          <Input
            label="Muqova rasmi (URL)"
            value={form.thumbnail_url}
            onChange={(v) => setForm({ ...form, thumbnail_url: v })}
          />
          <Input label="PDF material (URL)" value={form.pdf_url} onChange={(v) => setForm({ ...form, pdf_url: v })} />
          <Input
            label="Davomiyligi (soniya)"
            value={form.duration_seconds}
            onChange={(v) => setForm({ ...form, duration_seconds: v.replace(/\D/g, "") })}
          />
          <div>
            <label className="text-xs text-muted-foreground">Mavzu</label>
            <select
              value={form.topic_id}
              onChange={(e) => setForm({ ...form, topic_id: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">— tanlanmagan —</option>
              {(topics ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Chop etilgan
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-50"
            >
              {form.id ? "Yangilash" : "Qo'shish"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {isLoading && <div className="h-20 animate-pulse rounded-2xl bg-secondary" />}
        {(videos ?? []).map((v) => (
          <div key={v.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary">
              <VideoIcon className="h-5 w-5 text-brand" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{v.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {v.subject}
                {v.topics?.title ? ` • ${v.topics.title}` : ""} {v.is_published ? "" : "• qoralama"}
              </div>
            </div>
            <button
              onClick={() => {
                setForm({
                  id: v.id,
                  title: v.title,
                  description: v.description ?? "",
                  subject: v.subject,
                  topic_id: v.topic_id ?? "",
                  video_url: v.video_url,
                  thumbnail_url: v.thumbnail_url ?? "",
                  pdf_url: v.pdf_url ?? "",
                  duration_seconds: v.duration_seconds ? String(v.duration_seconds) : "",
                  is_published: v.is_published,
                });
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-secondary"
              aria-label="Tahrirlash"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => remove.mutate(v.id)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive hover:bg-secondary"
              aria-label="O'chirish"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}

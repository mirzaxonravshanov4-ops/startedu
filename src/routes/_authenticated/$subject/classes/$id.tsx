import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  Check,
  Circle,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Trophy,
  Users,
} from "lucide-react";


export const Route = createFileRoute("/_authenticated/$subject/classes/$id")({
  head: () => ({
    meta: [
      { title: "Sinf — StartEdu" },
      { name: "description", content: "Sinf vazifalari, o'quvchilar, chat va reyting." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClassPage,
});

type Tab = "assignments" | "members" | "chat" | "rating";

function ClassPage() {
  const subject = useSubject();
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("assignments");

  const { data, isLoading } = useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user!.id;
      const { data: cls, error } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      const isTeacher = cls?.teacher_id === uid;
      const { data: members } = await supabase
        .from("class_members")
        .select("id, student_id, status, joined_at, profiles:student_id(full_name, username, xp, level)")
        .eq("class_id", id);
      const { data: assignments } = await supabase
        .from("assignments")
        .select("*, topics(title, slug), video_lessons(title)")
        .eq("class_id", id)
        .order("due_at", { ascending: true, nullsFirst: false });
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("id, assignment_id, student_id, score, grade, feedback, is_late, submitted_at")
        .in("assignment_id", (assignments ?? []).map((a) => a.id).length ? (assignments ?? []).map((a) => a.id) : ["00000000-0000-0000-0000-000000000000"]);
      const { data: messages } = await supabase
        .from("class_messages")
        .select(
          "id, user_id, body, is_announcement, created_at, media_url, media_type, media_duration, profiles:user_id(full_name)",
        )
        .eq("class_id", id)
        .order("created_at", { ascending: true })
        .limit(200);
      return { uid, cls, isTeacher, members: members ?? [], assignments: assignments ?? [], submissions: submissions ?? [], messages: messages ?? [] };
    },
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }
  if (!data?.cls) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Sinf topilmadi yoki ruxsat yo'q.</p>
        <Link to="/$subject/classes" params={{ subject }} className="mt-4 inline-block text-sm text-brand hover:underline">
          Sinflarga qaytish
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "assignments", label: "Vazifalar" },
    { id: "members", label: "O'quvchilar" },
    { id: "chat", label: "Chat" },
    { id: "rating", label: "Reyting" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/$subject/classes" params={{ subject }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Sinflar
      </Link>

      <header className="mt-4 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold tracking-tight">{data.cls.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.cls.description ?? data.cls.subject}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {data.members.filter((m) => m.status === "active").length} o'quvchi
          </span>
          {data.isTeacher && (
            <span className="rounded-lg bg-secondary px-2 py-1 tracking-widest">Kod: {data.cls.join_code}</span>
          )}
        </div>
      </header>

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
              tab === t.id
                ? "border-brand/50 bg-brand/15 text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "assignments" && <Assignments data={data} classId={id} qc={qc} />}
        {tab === "members" && <Members data={data} qc={qc} />}
        {tab === "chat" && <Chat data={data} classId={id} qc={qc} />}
        {tab === "rating" && <Rating data={data} />}
      </div>
    </div>
  );
}

type Data = NonNullable<ReturnType<typeof useClassData>>;
function useClassData() {
  return null as unknown as {
    uid: string;
    cls: any;
    isTeacher: boolean;
    members: any[];
    assignments: any[];
    submissions: any[];
    messages: any[];
  };
}

type QC = ReturnType<typeof useQueryClient>;

function Assignments({ data, classId, qc }: { data: Data; classId: string; qc: QC }) {
  const subject = useSubject();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [videoId, setVideoId] = useState("");
  const [dueAt, setDueAt] = useState("");

  const { data: options } = useQuery({
    queryKey: ["assignment-options"],
    queryFn: async () => {
      const [{ data: topics }, { data: videos }] = await Promise.all([
        supabase.from("topics").select("id, title").eq("is_published", true).order("title"),
        supabase.from("video_lessons").select("id, title").eq("is_published", true).order("title"),
      ]);
      return { topics: topics ?? [], videos: videos ?? [] };
    },
    enabled: data.isTeacher,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (title.trim().length < 2) throw new Error("Sarlavha juda qisqa");
      const { error } = await supabase.from("assignments").insert({
        class_id: classId,
        created_by: data.uid,
        title: title.trim(),
        description: description.trim() || null,
        kind: videoId ? "video" : "test",
        topic_id: topicId || null,
        video_id: videoId || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vazifa yaratildi");
      setTitle("");
      setDescription("");
      setTopicId("");
      setVideoId("");
      setDueAt("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["class", classId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: async (assignment: any) => {
      const isLate = assignment.due_at ? new Date(assignment.due_at) < new Date() : false;
      const { error } = await supabase.from("assignment_submissions").upsert(
        { assignment_id: assignment.id, student_id: data.uid, is_late: isLate },
        { onConflict: "assignment_id,student_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bajarildi deb belgilandi");
      qc.invalidateQueries({ queryKey: ["class", classId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grade = useMutation({
    mutationFn: async (payload: { id: string; grade: number; feedback: string }) => {
      const { error } = await supabase
        .from("assignment_submissions")
        .update({ grade: payload.grade, feedback: payload.feedback || null })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Baho qo'yildi");
      qc.invalidateQueries({ queryKey: ["class", classId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {data.isTeacher && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4 text-brand" /> Yangi vazifa
          </button>
          {open && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sarlavha"
                className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand sm:col-span-2"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Tavsif / topshiriq matni"
                className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand sm:col-span-2"
              />
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="">Mavzu (test) — tanlanmagan</option>
                {(options?.topics ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <select
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="">Video dars — tanlanmagan</option>
                {(options?.videos ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
              <label className="text-xs text-muted-foreground sm:col-span-2">
                Tugash vaqti
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>
              <button
                type="submit"
                disabled={create.isPending}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-50 sm:col-span-2"
              >
                Yaratish
              </button>
            </form>
          )}
        </div>
      )}

      {data.assignments.length === 0 && (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Hozircha vazifa yo'q.
        </p>
      )}

      {data.assignments.map((a) => {
        const subs = data.submissions.filter((s) => s.assignment_id === a.id);
        const mine = subs.find((s) => s.student_id === data.uid);
        const closed = a.due_at ? new Date(a.due_at) < new Date() : false;
        return (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">{a.title}</div>
                {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {a.due_at && (
                    <span className={`inline-flex items-center gap-1 ${closed ? "text-destructive" : ""}`}>
                      <CalendarClock className="h-3.5 w-3.5" />
                      {new Date(a.due_at).toLocaleString("uz-UZ")} {closed ? "• muddat tugagan" : ""}
                    </span>
                  )}
                  {a.topics?.title && <span>Mavzu: {a.topics.title}</span>}
                  {a.video_lessons?.title && <span>Video: {a.video_lessons.title}</span>}
                </div>
              </div>
              {!data.isTeacher && (
                <div className="flex flex-wrap gap-2">
                  {a.topics?.slug && (
                    <Link
                      to="/$subject/topics/$slug"
                      params={{ subject, slug: a.topics.slug }}
                      className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-secondary"
                    >
                      Test ishlash
                    </Link>
                  )}
                  {a.video_id && (
                    <Link
                      to="/$subject/videos/$id"
                      params={{ subject, id: a.video_id }}
                      className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-secondary"
                    >
                      Videoni ko'rish
                    </Link>
                  )}
                  <button
                    disabled={closed || !!mine || submit.isPending}
                    onClick={() => submit.mutate(a)}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
                  >
                    {mine ? "Bajarilgan" : closed ? "Yopilgan" : "Bajardim"}
                  </button>
                </div>
              )}
            </div>

            {mine?.grade != null && (
              <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs">
                Baho: <b>{mine.grade}</b> {mine.feedback ? `— ${mine.feedback}` : ""}
              </p>
            )}

            {data.isTeacher && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <div className="text-xs text-muted-foreground">
                  Bajardi: {subs.length} / {data.members.filter((m) => m.status === "active").length}
                  {subs.filter((s) => s.is_late).length ? ` • kechikkan: ${subs.filter((s) => s.is_late).length}` : ""}
                </div>
                {subs.map((s) => {
                  const member = data.members.find((m) => m.student_id === s.student_id);
                  return (
                    <GradeRow
                      key={s.id}
                      name={member?.profiles?.full_name ?? "O'quvchi"}
                      sub={s}
                      onSave={(g, f) => grade.mutate({ id: s.id, grade: g, feedback: f })}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GradeRow({
  name,
  sub,
  onSave,
}: {
  name: string;
  sub: any;
  onSave: (grade: number, feedback: string) => void;
}) {
  const [g, setG] = useState(sub.grade != null ? String(sub.grade) : "");
  const [f, setF] = useState(sub.feedback ?? "");
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/50 p-2 text-sm">
      <span className="min-w-32 flex-1 truncate">
        {name} {sub.is_late && <span className="text-destructive text-xs">(kech)</span>}
      </span>
      <input
        value={g}
        onChange={(e) => setG(e.target.value.replace(/\D/g, "").slice(0, 3))}
        placeholder="Baho"
        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand"
      />
      <input
        value={f}
        onChange={(e) => setF(e.target.value)}
        placeholder="Izoh"
        className="min-w-32 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand"
      />
      <button
        onClick={() => onSave(Number(g || 0), f)}
        className="grid h-7 w-7 place-items-center rounded-lg border border-border hover:bg-secondary"
        aria-label="Saqlash"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Members({ data, qc }: { data: Data; qc: QC }) {
  const toggle = useMutation({
    mutationFn: async (m: any) => {
      const { error } = await supabase
        .from("class_members")
        .update({ status: m.status === "active" ? "blocked" : "active" })
        .eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class", data.cls.id] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (m: any) => {
      const { error } = await supabase.from("class_members").delete().eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'quvchi chiqarildi");
      qc.invalidateQueries({ queryKey: ["class", data.cls.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data.members.length)
    return (
      <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Hali o'quvchilar qo'shilmagan. Sinf kodini ular bilan ulashing.
      </p>
    );

  return (
    <div className="space-y-2">
      {data.members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{m.profiles?.full_name ?? "O'quvchi"}</div>
            <div className="text-xs text-muted-foreground">
              {m.profiles?.xp ?? 0} XP • {m.profiles?.level ?? 1}-daraja
              {m.status === "blocked" ? " • bloklangan" : ""}
            </div>
          </div>
          {data.isTeacher && (
            <>
              <button
                onClick={() => toggle.mutate(m)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                {m.status === "active" ? "Bloklash" : "Ochish"}
              </button>
              <button
                onClick={() => remove.mutate(m)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-secondary"
                aria-label="Chiqarish"
              >
                <Ban className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/** Resolves a private storage path into a temporary signed URL. */
function useSignedUrl(path: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["class-media-url", path],
    enabled: !!path,
    staleTime: 45 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("class-media").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return data ?? null;
}

function MessageMedia({ path, type }: { path: string; type: string }) {
  const url = useSignedUrl(path);
  if (!url) return <div className="mt-2 h-24 w-40 animate-pulse rounded-xl bg-secondary" />;
  if (type === "circle")
    return (
      <video
        src={url}
        controls
        playsInline
        className="mt-2 h-40 w-40 rounded-full border border-border object-cover"
      />
    );
  if (type === "video") return <video src={url} controls className="mt-2 max-h-72 w-full rounded-xl" />;
  if (type === "audio") return <audio src={url} controls className="mt-2 w-full" />;
  if (type === "image")
    return <img src={url} alt="Chat rasmi" className="mt-2 max-h-72 rounded-xl border border-border object-contain" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand hover:underline">
      <Paperclip className="h-3.5 w-3.5" /> Faylni yuklab olish
    </a>
  );
}

function kindOf(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 864e5);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Bugun";
  if (same(d, yest)) return "Kecha";
  return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Chat({ data, classId, qc }: { data: Data; classId: string; qc: QC }) {
  const [body, setBody] = useState("");
  const [announce, setAnnounce] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Yangi xabar kelganda pastga tushirish.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [data.messages.length]);

  const post = useMutation({
    mutationFn: async (payload: {
      text: string;
      file?: { blob: Blob; name: string; type: string; duration?: number };
    }) => {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      if (payload.file) {
        const ext = payload.file.name.split(".").pop() || "bin";
        const path = `${data.uid}/${classId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("class-media")
          .upload(path, payload.file.blob, { contentType: payload.file.blob.type || "application/octet-stream" });
        if (upErr) throw upErr;
        mediaUrl = path;
        mediaType = payload.file.type;
      }
      if (!payload.text.trim() && !mediaUrl) return;
      const { error } = await supabase.from("class_messages").insert({
        class_id: classId,
        user_id: data.uid,
        body: payload.text.trim().slice(0, 2000),
        is_announcement: data.isTeacher && announce,
        media_url: mediaUrl,
        media_type: mediaType,
        media_duration: payload.file?.duration ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["class", classId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function pickFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Fayl hajmi 25MB dan kichik bo'lsin");
      return;
    }
    post.mutate({ text: body, file: { blob: file, name: file.name, type: kindOf(file.type) } });
    if (fileRef.current) fileRef.current.value = "";
  }

  function stopTracks() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const stream = previewRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (previewRef.current) previewRef.current.srcObject = null;
  }

  async function startCircle() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: "user" },
        audio: true,
      });
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        void previewRef.current.play();
      }
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const secs = seconds;
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        stopTracks();
        setRecording(false);
        setSeconds(0);
        if (blob.size > 1000)
          post.mutate({ text: body, file: { blob, name: "circle.webm", type: "circle", duration: secs } });
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= 60) recorderRef.current?.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("Kamera/mikrofonga ruxsat berilmadi");
    }
  }

  function cancelCircle() {
    const rec = recorderRef.current;
    chunksRef.current = [];
    if (rec && rec.state !== "inactive") rec.onstop = null as never;
    rec?.stop();
    stopTracks();
    setRecording(false);
    setSeconds(0);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div ref={scrollRef} className="h-[26rem] space-y-2 overflow-y-auto p-4">
        {data.messages.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-5 w-5" /> Hozircha xabar yo'q — birinchi bo'lib yozing.
          </p>
        )}
        {data.messages.map((m, i) => {
          const mine = m.user_id === data.uid;
          const prev = data.messages[i - 1];
          const showDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at);
          const grouped = !!prev && !showDay && prev.user_id === m.user_id;
          const name = m.profiles?.full_name ?? "Foydalanuvchi";
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  {dayLabel(m.created_at)}
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine &&
                  (grouped ? (
                    <span className="w-7 shrink-0" />
                  ) : (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-semibold">
                      {initials(name)}
                    </span>
                  ))}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                    m.is_announcement
                      ? "border border-brand/40 bg-brand/10"
                      : mine
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background/60"
                  } ${mine ? "rounded-br-md" : "rounded-bl-md"}`}
                >
                  {!mine && !grouped && (
                    <div className="mb-0.5 text-[11px] font-medium opacity-70">{name}</div>
                  )}
                  {m.is_announcement && (
                    <div className="mb-0.5 text-[10px] uppercase tracking-widest text-brand">E'lon</div>
                  )}
                  {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                  {m.media_url && <MessageMedia path={m.media_url} type={m.media_type ?? "file"} />}
                  <div className={`mt-1 text-right text-[10px] ${mine ? "opacity-70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                    {m.media_duration ? ` • ${m.media_duration}s` : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {recording && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl border border-brand/40 bg-brand/10 p-3">
          <video ref={previewRef} muted playsInline className="h-24 w-24 rounded-full object-cover" />
          <div className="flex-1 text-sm">
            <div className="font-medium">Dumaloq video yozilmoqda…</div>
            <div className="text-xs text-muted-foreground">{seconds}s / 60s</div>
          </div>
          <button
            onClick={() => recorderRef.current?.stop()}
            className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            Yuborish
          </button>
          <button onClick={cancelCircle} className="rounded-xl border border-border px-3 py-2 text-xs">
            Bekor
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          post.mutate({ text: body });
        }}
        className="flex items-end gap-2 border-t border-border bg-background/40 p-3"
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,application/pdf"
          onChange={(e) => void pickFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={post.isPending || recording}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border hover:bg-secondary disabled:opacity-40"
          aria-label="Media yuklash"
          title="Rasm, video yoki fayl"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => (recording ? recorderRef.current?.stop() : void startCircle())}
          disabled={post.isPending}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border hover:bg-secondary disabled:opacity-40"
          aria-label="Dumaloq video"
          title="Dumaloq video (60s)"
        >
          <Circle className={`h-4 w-4 ${recording ? "text-destructive" : ""}`} />
        </button>
        <textarea
          value={body}
          rows={1}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              post.mutate({ text: body });
            }
          }}
          placeholder="Xabar yozing... (Enter — yuborish)"
          className="max-h-32 min-w-0 flex-1 resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        {data.isTeacher && (
          <label
            className={`flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs ${
              announce ? "border-brand/50 bg-brand/10 text-foreground" : "border-border text-muted-foreground"
            }`}
            title="E'lon sifatida yuborish"
          >
            <input
              type="checkbox"
              className="hidden"
              checked={announce}
              onChange={(e) => setAnnounce(e.target.checked)}
            />
            E'lon
          </label>
        )}
        <button
          type="submit"
          disabled={post.isPending}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground glow disabled:opacity-50"
          aria-label="Yuborish"
        >
          {post.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}






function Rating({ data }: { data: Data }) {
  const rows = [...data.members]
    .filter((m) => m.status === "active")
    .sort((a, b) => (b.profiles?.xp ?? 0) - (a.profiles?.xp ?? 0));
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {rows.map((m, i) => (
        <div key={m.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
          <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
          {i === 0 ? <Trophy className="h-4 w-4 text-brand" /> : <span className="w-4" />}
          <span className="flex-1 truncate text-sm">{m.profiles?.full_name ?? "O'quvchi"}</span>
          <span className="text-sm font-medium">{m.profiles?.xp ?? 0} XP</span>
        </div>
      ))}
      {!rows.length && (
        <p className="p-8 text-center text-sm text-muted-foreground">Reyting uchun o'quvchilar yo'q.</p>
      )}
    </div>
  );
}

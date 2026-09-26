import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Plus, Users, LogIn, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$subject/classes/")({
  head: () => ({
    meta: [
      { title: "Sinflar — StartEdu" },
      { name: "description", content: "O'qituvchi va o'quvchi sinflari, vazifalar va sinf reytingi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClassesPage,
});

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function ClassesPage() {
  const subject = useSubject();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [classSubject, setClassSubject] = useState("Matematika");
  const [joinCode, setJoinCode] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-classes"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user!.id;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const isTeacher = (roles ?? []).some((r) => r.role === "teacher" || r.role === "admin" || r.role === "premium");
      const { data: teaching } = await supabase
        .from("classes")
        .select("id, name, description, subject, join_code, is_active")
        .eq("teacher_id", uid)
        .order("created_at", { ascending: false });
      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id, status, classes(id, name, description, subject, is_active)")
        .eq("student_id", uid);
      return { uid, isTeacher, teaching: teaching ?? [], memberships: memberships ?? [] };
    },
  });

  const createClass = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 2) throw new Error("Sinf nomi juda qisqa");
      const { error } = await supabase.from("classes").insert({
        teacher_id: data!.uid,
        name: name.trim(),
        description: description.trim() || null,
        subject: classSubject.trim() || "Matematika",
        join_code: randomCode(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sinf yaratildi");
      setName("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["my-classes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const join = useMutation({
    mutationFn: async () => {
      const code = joinCode.trim().toUpperCase();
      if (code.length < 4) throw new Error("Kod noto'g'ri");
      const { error } = await supabase.rpc("join_class_by_code", { _code: code });
      if (error) throw new Error(error.message.replace(/^.*?:\s*/, ""));
    },
    onSuccess: () => {
      toast.success("Sinfga qo'shildingiz");
      setJoinCode("");
      qc.invalidateQueries({ queryKey: ["my-classes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-brand">Sinf tizimi</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Sinflarim</h1>
        <p className="mt-3 text-muted-foreground">
          O'qituvchilar sinf yaratadi, o'quvchilar noyob kod orqali qo'shiladi.
        </p>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {data?.isTeacher && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createClass.mutate();
            }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="flex items-center gap-2 font-semibold">
              <Plus className="h-4 w-4 text-brand" /> Yangi sinf yaratish
            </h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sinf nomi (masalan: 9-A Matematika)"
              className="mt-3 w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              value={classSubject}
              onChange={(e) => setClassSubject(e.target.value)}
              placeholder="Fan"
              className="mt-2 w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Tavsif"
              className="mt-2 w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={createClass.isPending}
              className="mt-3 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-50"
            >
              Yaratish
            </button>
          </form>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            join.mutate();
          }}
          className="h-fit rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="flex items-center gap-2 font-semibold">
            <LogIn className="h-4 w-4 text-brand" /> Sinf kodi orqali qo'shilish
          </h2>
          <div className="mt-3 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Masalan: A7K2QX"
              maxLength={8}
              className="flex-1 rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm tracking-widest outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={join.isPending}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
            >
              Qo'shilish
            </button>
          </div>
        </form>
      </div>

      {isLoading && <div className="mt-8 h-24 animate-pulse rounded-2xl bg-secondary" />}

      {!!data?.teaching.length && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">O'qituvchi sifatida</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.teaching.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
                <Link to="/$subject/classes/$id" params={{ subject, id: c.id }} className="block">
                  <div className="flex items-center gap-2 font-medium">
                    <GraduationCap className="h-4 w-4 text-brand" /> {c.name}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {c.description ?? c.subject}
                  </p>
                </Link>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(c.join_code);
                    toast.success("Kod nusxalandi");
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs tracking-widest hover:bg-secondary"
                >
                  <Copy className="h-3 w-3" /> {c.join_code}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!data?.memberships.length && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">O'quvchi sifatida</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.memberships
              .filter((m) => m.classes)
              .map((m) => (
                <Link
                  key={m.class_id}
                  to="/$subject/classes/$id"
                  params={{ subject, id: m.class_id }}
                  className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/50"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 text-brand" /> {m.classes!.name}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.status === "blocked" ? "Bloklangan" : m.classes!.subject}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      )}

      {!isLoading && !data?.teaching.length && !data?.memberships.length && (
        <p className="mt-10 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Hozircha sinf yo'q. Kod orqali qo'shiling yoki o'qituvchi bo'lsangiz yangi sinf yarating.
        </p>
      )}
    </div>
  );
}

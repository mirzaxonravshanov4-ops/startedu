import { useSubject } from "@/lib/subject";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AccessAlert } from "@/components/access-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Crown, Globe2, KeyRound, Loader2, Plus, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$subject/global/")({
  head: () => ({
    meta: [
      { title: "Global testlar — StartEdu" },
      { name: "description", content: "6 xonali maxsus kod orqali global testni ishlang yoki o'z testingizni yarating." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GlobalPage,
});

function GlobalPage() {
  const subject = useSubject();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isPremium } = useAuth();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [creating, setCreating] = useState(false);

  const myTests = useQuery({
    queryKey: ["global-my-tests"],
    enabled: isPremium,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_tests")
        .select("id, code, title, duration_minutes, is_active, created_at, global_test_questions(count), global_test_attempts(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createTest = useMutation({
    mutationFn: async () => {
      const { data: sess } = await supabase.auth.getUser();
      const uid = sess.user?.id;
      if (!uid) throw new Error("Avtorizatsiya talab qilinadi");
      const t = title.trim();
      if (t.length < 3) throw new Error("Test nomi kamida 3 belgi bo'lishi kerak");
      const { data, error } = await supabase
        .from("global_tests")
        .insert({ owner_id: uid, title: t, code: "", duration_minutes: Math.max(1, Math.min(300, duration)) })
        .select("id, code")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      toast.success(`Test yaratildi. Kod: ${d.code}`);
      setTitle("");
      qc.invalidateQueries({ queryKey: ["global-my-tests"] });
      navigate({ to: "/$subject/global/manage/$id", params: { subject, id: d.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("global_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Test o'chirildi");
      qc.invalidateQueries({ queryKey: ["global-my-tests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openByCode(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 6) {
      toast.error("Kod 6 belgidan iborat bo'lishi kerak");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc("global_test_by_code", { _code: c });
      if (error) throw error;
      const row = (data ?? [])[0];
      if (!row) throw new Error("Bunday kodli faol test topilmadi");
      navigate({ to: "/$subject/global/t/$code", params: { subject, code: c } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary glow">
          <Globe2 className="h-5 w-5 text-primary-foreground" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Maxsus 6 xonali kod orqali istalgan testni ishlang.
          </p>
        </div>
      </div>

      <form
        onSubmit={openByCode}
        className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
      >
        <label className="text-sm font-medium">Test kodini kiriting</label>
        <p className="mt-1 text-xs text-muted-foreground">
          Testni yaratgan foydalanuvchi sizga 6 belgili kod beradi (masalan: A7K2QM).
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="A7K2QM"
              inputMode="text"
              autoComplete="off"
              className="w-full rounded-xl border border-border bg-background/50 py-3 pl-10 pr-3 text-lg font-semibold tracking-[0.4em] outline-none focus:border-brand"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground glow disabled:opacity-60"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Testni boshlash
          </button>
        </div>
      </form>

      {!isPremium ? (
        <div className="mt-8 rounded-2xl border border-foreground/30 bg-foreground/5 p-6">
          <div className="flex items-center gap-2 text-foreground">
            <Crown className="h-5 w-5" />
            <span className="font-medium">Premium imkoniyat</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            O'z global testingizni yaratish uchun premium rol kerak. Premium rolini administrator beradi.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-foreground" />
              <h2 className="font-semibold">Yangi global test yaratish</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Test nomi"
                className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <input
                type="number"
                min={1}
                max={300}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="Daqiqa"
                className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button
                onClick={() => createTest.mutate()}
                disabled={createTest.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand/50 px-4 py-2.5 text-sm font-medium text-brand hover:bg-brand/10 disabled:opacity-60"
              >
                {createTest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Yaratish
              </button>
            </div>
          </div>

          <h2 className="mt-10 font-semibold">Mening global testlarim</h2>
          {myTests.error && <AccessAlert error={myTests.error} className="mt-4" />}
          {myTests.isLoading ? (
            <Skeleton className="mt-4 h-40 rounded-2xl" />
          ) : (myTests.data ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Hozircha test yaratmagansiz.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(myTests.data ?? []).map((t) => {
                const qCount = (t.global_test_questions as unknown as { count: number }[])?.[0]?.count ?? 0;
                const aCount = (t.global_test_attempts as unknown as { count: number }[])?.[0]?.count ?? 0;
                return (
                  <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{t.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {qCount} savol · {t.duration_minutes} daqiqa ·{" "}
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" /> {aCount}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-lg bg-brand/10 px-2.5 py-1 font-mono text-sm font-semibold tracking-widest text-brand">
                        {t.code}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to="/$subject/global/manage/$id"
                        params={{ subject, id: t.id }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                      >
                        Tahrirlash
                      </Link>
                      <button
                        onClick={() => {
                          void navigator.clipboard?.writeText(t.code);
                          toast.success("Kod nusxalandi");
                        }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                      >
                        Kodni nusxalash
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Testni o'chirishni tasdiqlaysizmi?")) removeTest.mutate(t.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> O'chirish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

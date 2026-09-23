import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Award, Book, ChevronRight, Flame, GraduationCap, LogOut, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { computeBadges } from "@/lib/gamification";
import { BadgesGrid } from "@/components/badges-grid";
import { AccessAlert } from "@/components/access-alert";
import { useSubject } from "@/lib/subject";
import type { AppError } from "@/lib/perm-error";


export const Route = createFileRoute("/_authenticated/$subject/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel — StartEdu" },
      { name: "description", content: "Sizning shaxsiy ta'lim panelingiz." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const subject = useSubject();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("No user");
      // get_my_profile: barcha ustunlarni (email/telefon ham) faqat egasiga qaytaradi.
      const { data: p, error: pErr } = await supabase.rpc("get_my_profile");
      if (pErr) throw pErr;
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (rErr) throw rErr;
      const { data: attempts, error: aErr } = await supabase
        .from("test_attempts")
        .select("score, completed_at")
        .eq("user_id", user.id)
        .not("completed_at", "is", null);
      if (aErr) throw aErr;
      const attemptCount = attempts?.length ?? 0;
      const perfectScores = (attempts ?? []).filter((a) => (a.score ?? 0) >= 100).length;
      return { user, profile: p, roles: roles?.map((r) => r.role) ?? [], attemptCount, perfectScores };
    },
  });


  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Tizimdan chiqdingiz");
    navigate({ to: "/auth", replace: true });
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <AccessAlert error={error as AppError} />
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded-lg bg-secondary" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-secondary" />
            ))}
          </div>
        </div>
      </div>
    );
  }


  const name = profile.profile?.full_name ?? profile.user.email ?? "Talaba";
  const initial = name.charAt(0).toUpperCase();

  const stats = [
    { icon: Sparkles, l: "XP", v: profile.profile?.xp ?? 0 },
    { icon: Trophy, l: "Daraja", v: profile.profile?.level ?? 1 },
    { icon: Flame, l: "Streak (kun)", v: profile.profile?.streak_days ?? 0 },
    { icon: Award, l: "Testlar", v: profile.attemptCount },
  ];

  const badges = computeBadges({
    xp: profile.profile?.xp ?? 0,
    level: profile.profile?.level ?? 1,
    streak: profile.profile?.streak_days ?? 0,
    attempts: profile.attemptCount,
    perfectScores: profile.perfectScores,
  });
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground glow">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Xush kelibsiz</div>
            <h1 className="truncate text-2xl font-bold sm:text-3xl">{name}</h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {profile.roles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {profile.roles.includes("admin") && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-sm text-brand hover:bg-brand/20"
            >
              <ShieldCheck className="h-4 w-4" /> <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl glass">
              <s.icon className="h-5 w-5 text-brand" />
            </span>
            <div className="mt-4 text-3xl font-bold gradient-text">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-4">
        {[
          { icon: Book, t: "Mavzulashtirilgan", d: "Mavzular bo'yicha tartiblangan matematika testlari.", to: "/$subject/topics" as const },
          { icon: GraduationCap, t: "Milliy sertifikat", d: "Milliy sertifikat formatidagi testlar.", to: "/$subject/milliy-sertifikat" as const },
          { icon: Sparkles, t: "Visual Lab", d: "Mavzularni interaktiv vizual tajribalar bilan o'rganing.", to: "/$subject/lab" as const },
          { icon: Trophy, t: "Reyting", d: "Top o'quvchilar orasida o'z o'rningizni ko'ring.", to: "/$subject/leaderboard" as const },
        ].map((c) => (
          <Link
            key={c.t}
            to={c.to}
            params={{ subject }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand/50"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <c.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs text-brand">
              Ochish <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Nishonlar</h2>
            <p className="text-xs text-muted-foreground">Yutuqlaringiz uchun nishonlar to'plang.</p>
          </div>
          <div className="text-xs text-muted-foreground">{earnedCount} / {badges.length}</div>
        </div>
        <div className="mt-4">
          <BadgesGrid badges={badges} />
        </div>
      </section>
    </div>
  );
}

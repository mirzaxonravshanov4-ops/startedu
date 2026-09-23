import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  ListChecks,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { DIRECTIONS } from "@/lib/directions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: "Admin panel — StartEdu" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminIndex,
});

const WEEKDAYS = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"];

function AdminIndex() {
  const qc = useQueryClient();
  const { isAdmin } = Route.useRouteContext();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    enabled: isAdmin,
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const [topics, questions, users, attempts, activeUsers, recentTopics, recentUsers, attemptRows, createdRows] =
        await Promise.all([
          supabase.from("topics").select("id", { count: "exact", head: true }),
          supabase.from("questions").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("test_attempts").select("id", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gte("last_active_at", weekAgo),
          supabase
            .from("topics")
            .select("id, title, category, created_at")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("profiles")
            .select("id, full_name, username, created_at")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("test_attempts")
            .select("id, topic_id, topics(title, category)")
            .not("completed_at", "is", null)
            .limit(1000),
          supabase.from("topics").select("created_at").gte("created_at", weekAgo),
        ]);

      const byTest = new Map<string, number>();
      for (const a of attemptRows.data ?? []) {
        const title = a.topics?.title ?? "Boshqa";
        byTest.set(title, (byTest.get(title) ?? 0) + 1);
      }

      // haftalik kümülyativ progress
      const perDay = new Array(7).fill(0) as number[];
      for (const r of createdRows.data ?? []) {
        const d = new Date(r.created_at);
        const idx = (d.getDay() + 6) % 7;
        perDay[idx] = (perDay[idx] ?? 0) + 1;
      }
      let running = 0;
      const progress = WEEKDAYS.map((name, i) => {
        running += perDay[i] ?? 0;
        return { name, value: running };
      });

      return {
        topics: topics.count ?? 0,
        questions: questions.count ?? 0,
        users: users.count ?? 0,
        attempts: attempts.count ?? 0,
        activeUsers: activeUsers.count ?? 0,
        recentTopics: recentTopics.data ?? [],
        recentUsers: recentUsers.data ?? [],
        progress,
        topTests: [...byTest.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name: name.length > 12 ? `${name.slice(0, 12)}…` : name, value })),
      };
    },
  });

  if (!isAdmin) return null;

  const cards = [
    { l: "Jami foydalanuvchilar", v: data?.users ?? 0, i: Users },
    { l: "Faol foydalanuvchilar (7 kun)", v: data?.activeUsers ?? 0, i: Activity },
    { l: "Yaratilgan testlar", v: data?.topics ?? 0, i: BookOpen },
    { l: "Savollar", v: data?.questions ?? 0, i: ListChecks },
    { l: "Ishlangan testlar", v: data?.attempts ?? 0, i: ShieldCheck },
  ];

  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    fontSize: 12,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Admin paneli</h1>
      <p className="mt-1 text-sm text-muted-foreground">Umumiy statistika va test yo'nalishlari</p>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.l}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl glass">
                <c.i className="h-5 w-5 text-brand" />
              </span>
              <div className="mt-4 text-3xl font-bold gradient-text">{c.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <BarChart3 className="h-5 w-5 text-brand" /> Eng ko'p ishlangan testlar
        </h2>
        <div className="mt-5 h-64">
          {data?.topTests.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topTests} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(139,92,246,0.08)" }}
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [v, "Ishlanish soni"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="grid h-full place-items-center text-xs text-muted-foreground">Ma'lumot yo'q</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <TrendingUp className="h-5 w-5 text-foreground" /> Yaratilgan testlar (Progress)
        </h2>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.progress ?? []} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "currentColor" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Jami testlar"]} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#progressFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DIRECTIONS.map((d) => (
          <Link
            key={d.key}
            to="/admin/direction/$key"
            params={{ key: d.key }}
            className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:border-brand/50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl glass">
              <d.icon className="h-6 w-6 text-brand" />
            </span>
            <h3 className="mt-5 text-lg font-bold">{d.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Testlarni boshqarish uchun kiring</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs text-brand opacity-0 transition-opacity group-hover:opacity-100">
              Ochish <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Oxirgi yaratilgan testlar</h2>
            <Link to="/admin/topics" className="text-xs text-brand hover:underline">
              Barchasi
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(data?.recentTopics ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate">{t.title}</span>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.category}
                </span>
              </li>
            ))}
            {!data?.recentTopics.length && (
              <li className="py-4 text-xs text-muted-foreground">Ma'lumot yo'q</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Oxirgi qo'shilgan foydalanuvchilar</h2>
            <Link to="/admin/users" className="text-xs text-brand hover:underline">
              Barchasi
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(data?.recentUsers ?? []).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate">{u.full_name ?? u.username ?? "—"}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("uz-UZ") : "—"}
                </span>
              </li>
            ))}
            {!data?.recentUsers.length && (
              <li className="py-4 text-xs text-muted-foreground">Ma'lumot yo'q</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Globe2, GraduationCap, Landmark, Map, Medal, Trophy } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/$subject/leaderboard")({
  head: () => ({
    meta: [
      { title: "Reyting — StartEdu" },
      { name: "description", content: "Dunyo, respublika, viloyat va maktab bo'yicha reyting." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeaderboardPage,
});

type Scope = "world" | "country" | "region" | "school";

const SCOPES: { v: Scope; l: string; icon: typeof Globe2 }[] = [
  { v: "world", l: "Dunyo", icon: Globe2 },
  { v: "country", l: "Respublika", icon: Landmark },
  { v: "region", l: "Viloyat", icon: Map },
  { v: "school", l: "Maktab", icon: GraduationCap },
];

function LeaderboardPage() {
  const [scope, setScope] = useState<Scope>("world");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-all"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const me = userRes.user?.id ?? null;
      // Other users' contact/location data stays private; the server only tells us
      // whether each row shares our country, region or school.
      const [{ data: rowsData, error }, { data: myProfile }] = await Promise.all([
        supabase.rpc("leaderboard_rows"),
        supabase.rpc("get_my_profile"),
      ]);
      if (error) throw error;
      return { me, rows: rowsData ?? [], myProfile: myProfile ?? null };
    },
  });

  const rows = data?.rows ?? [];
  const my = data?.myProfile ?? null;

  const filtered = rows.filter((u) => {
    if (scope === "world") return true;
    if (!my) return false;
    if (scope === "country") return !!u.same_country;
    if (scope === "region") return !!my.region && !!u.same_region;
    return !!my.school && !!u.same_school;
  });

  const myRank = my ? filtered.findIndex((u) => u.id === my.id) + 1 : 0;
  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const missingInfo =
    (scope === "region" && !my?.region) || (scope === "school" && !my?.school);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-brand">Reyting</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Top o'quvchilar</h1>
        <p className="mt-3 text-muted-foreground">
          Testlarda va to'liq testlarda XP to'plang. Dunyo, respublika, viloyat va maktab bo'yicha
          o'z o'rningizni kuzating.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.v}
            onClick={() => setScope(s.v)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              scope === s.v
                ? "border-brand/50 bg-brand/10 text-brand"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <s.icon className="h-4 w-4" /> {s.l}
          </button>
        ))}
      </div>

      {!!my && !missingInfo && (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-brand/40 bg-brand/5 p-5">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Sizning o'rningiz</div>
            <div className="truncate font-semibold">{my.full_name ?? my.username ?? "Siz"}</div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {[my.school, my.district, my.region, my.country].filter(Boolean).join(" · ") || "Joylashuv kiritilmagan"}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold gradient-text">#{myRank || "—"}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {filtered.length} ta ishtirokchi
            </div>
          </div>
        </div>
      )}

      {missingInfo && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          {scope === "region"
            ? "Viloyat bo'yicha reytingni ko'rish uchun profilingizda viloyatni kiriting."
            : "Maktab bo'yicha reytingni ko'rish uchun profilingizda maktabni kiriting."}
        </div>
      )}

      {isLoading && <Skeleton className="mt-8 h-64 rounded-2xl" />}

      {!isLoading && !missingInfo && filtered.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">Reyting hali bo'sh. Birinchi bo'ling!</p>
      )}

      {!isLoading && !missingInfo && top3.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {top3.map((u, i) => {
            const Icon = i === 0 ? Crown : i === 1 ? Trophy : Medal;
            const color = i === 0 ? "text-foreground" : i === 1 ? "text-foreground" : "text-foreground";
            return (
              <div
                key={u.id}
                className={`rounded-2xl border p-5 text-center ${
                  i === 0 ? "border-brand/50 bg-brand/5 sm:-mt-3" : "border-border bg-card"
                }`}
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div className="mt-3 text-xs text-muted-foreground">#{i + 1}</div>
                <div className="mt-1 truncate font-semibold">
                  {u.full_name ?? u.username ?? "Foydalanuvchi"}
                </div>
                <div className="mt-2 text-2xl font-bold gradient-text">{u.xp}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  XP · Lvl {u.level}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!missingInfo && rest.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Foydalanuvchi</th>
                <th className="px-4 py-3 text-right">Level</th>
                <th className="px-4 py-3 text-right">Streak</th>
                <th className="px-4 py-3 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((u, i) => {
                const isMe = u.id === data?.me;
                return (
                  <tr key={u.id} className={`border-t border-border ${isMe ? "bg-brand/5" : ""}`}>
                    <td className="px-4 py-3 text-muted-foreground">{i + 4}</td>
                    <td className="px-4 py-3 font-medium">
                      {u.full_name ?? u.username ?? "Foydalanuvchi"}
                      {isMe && (
                        <span className="ml-2 rounded-full border border-brand/40 px-2 py-0.5 text-[10px] text-brand">
                          Siz
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{u.level}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{u.streak_days}</td>
                    <td className="px-4 py-3 text-right font-semibold">{u.xp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

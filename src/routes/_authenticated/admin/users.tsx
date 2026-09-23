import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ban, Check, Crown, Search, ShieldCheck, ShieldOff, Sparkles, Trash2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [{ title: "Foydalanuvchilar — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsers,
});

type Role = "admin" | "teacher" | "student" | "premium";

function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.rpc("admin_list_profiles"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      const rolesByUser = new Map<string, Role[]>();
      for (const r of roles.data ?? []) {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role as Role);
        rolesByUser.set(r.user_id, arr);
      }
      return (profiles.data ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
    },
  });

  const rows = data ?? [];
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((u) =>
      [u.full_name, u.username, u.email].some((v) => (v ?? "").toLowerCase().includes(n)),
    );
  }, [rows, q]);

  const stats = [
    { l: "Jami foydalanuvchilar", v: rows.length, i: Users },
    { l: "Adminlar", v: rows.filter((u) => u.roles.includes("admin")).length, i: ShieldCheck },
    { l: "Premium", v: rows.filter((u) => u.roles.includes("premium")).length, i: Crown },
    {
      l: "Oddiy",
      v: rows.filter((u) => !u.roles.includes("admin") && !u.roles.includes("premium")).length,
      i: Sparkles,
    },
  ];

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: Role; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Rol yangilandi");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setBan = useMutation({
    mutationFn: async ({ userId, banned }: { userId: string; banned: boolean }) => {
      const { error } = await supabase.rpc("admin_set_banned", { _user_id: userId, _banned: banned });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.banned ? "Foydalanuvchi bloklandi" : "Foydalanuvchi faollashtirildi");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Foydalanuvchi profili o'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const btn =
    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors whitespace-nowrap";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rollar, premium va bloklashni boshqaring.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ism, login yoki email"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl glass">
              <s.i className="h-5 w-5 text-brand" />
            </span>
            <div className="mt-3 text-2xl font-bold gradient-text">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="mt-6 h-80 rounded-2xl" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Ism Familiya</th>
                <th className="px-4 py-3 text-left">Login</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Oxirgi faollik</th>
                <th className="px-4 py-3 text-left">Ro'yxatdan o'tgan</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isAdmin = u.roles.includes("admin");
                const isPremium = u.roles.includes("premium");
                return (
                  <tr key={u.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">
                      {u.full_name ?? "—"}
                      {u.is_banned && (
                        <span className="ml-2 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] text-destructive">
                          Bloklangan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.username ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          isAdmin
                            ? "bg-brand/15 text-brand"
                            : isPremium
                              ? "bg-foreground/15 text-foreground"
                              : "border border-border text-muted-foreground"
                        }`}
                      >
                        {isAdmin ? "Admin" : isPremium ? "Premium" : "Oddiy"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.last_active_at ? new Date(u.last_active_at).toLocaleString("uz-UZ") : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("uz-UZ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => toggleRole.mutate({ userId: u.id, role: "admin", has: isAdmin })}
                          className={`${btn} ${isAdmin ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "border-brand/40 text-brand hover:bg-brand/10"}`}
                        >
                          {isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          {isAdmin ? "Adminni olish" : "Admin"}
                        </button>
                        <button
                          onClick={() => toggleRole.mutate({ userId: u.id, role: "premium", has: isPremium })}
                          className={`${btn} border-foreground/40 text-foreground hover:bg-foreground/10`}
                        >
                          <Crown className="h-3.5 w-3.5" /> {isPremium ? "Premiumni olish" : "Premium"}
                        </button>
                        <button
                          onClick={() => setBan.mutate({ userId: u.id, banned: !u.is_banned })}
                          className={`${btn} border-border text-muted-foreground hover:bg-secondary`}
                        >
                          {u.is_banned ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          {u.is_banned ? "Faollashtirish" : "Ban"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Profilni o'chirishni tasdiqlaysizmi?")) removeUser.mutate(u.id);
                          }}
                          className={`${btn} border-destructive/40 text-destructive hover:bg-destructive/10`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Foydalanuvchi topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

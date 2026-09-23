import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, CalendarDays, KeyRound, Laptop, ListChecks, Mail, Save, Smartphone, Sparkles, Trash2, UserRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeviceKey } from "@/lib/device";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil — StartEdu" },
      { name: "description", content: "Shaxsiy profil ma'lumotlari va sozlamalari." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    first: "",
    last: "",
    username: "",
    phone: "",
    avatar: "",
    country: "",
    region: "",
    district: "",
    school: "",
  });

  const [pwd, setPwd] = useState({ a: "", b: "" });
  const [newEmail, setNewEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["profile-page"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user!;
      const [{ data: profile }, { data: roles }, certs, attempts] = await Promise.all([
        supabase.rpc("get_my_profile"),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase
          .from("test_attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .not("completed_at", "is", null),
      ]);
      return {
        user,
        profile,
        roles: (roles ?? []).map((r) => r.role),
        certCount: certs.count ?? 0,
        attemptCount: attempts.count ?? 0,
      };
    },
  });

  useEffect(() => {
    if (!data?.profile) return;
    const full = data.profile.full_name ?? "";
    const [first, ...rest] = full.split(" ");
    setForm({
      first: first ?? "",
      last: rest.join(" "),
      username: data.profile.username ?? "",
      phone: data.profile.phone ?? "",
      avatar: data.profile.avatar_url ?? "",
      country: data.profile.country ?? "O'zbekiston",
      region: data.profile.region ?? "",
      district: data.profile.district ?? "",
      school: data.profile.school ?? "",
    });
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: async () => {
      const full_name = `${form.first.trim()} ${form.last.trim()}`.trim();
      if (full_name.length < 2) throw new Error("Ism juda qisqa");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name,
          username: form.username.trim() || null,
          phone: form.phone.trim() || null,
          avatar_url: form.avatar.trim() || null,
          country: form.country.trim() || null,
          region: form.region.trim() || null,
          district: form.district.trim() || null,
          school: form.school.trim() || null,
        })
        .eq("id", data!.user.id);
      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Profil yangilandi");
      qc.invalidateQueries({ queryKey: ["profile-page"] });
      qc.invalidateQueries({ queryKey: ["auth-me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (pwd.a.length < 6) throw new Error("Parol kamida 6 belgidan iborat bo'lsin");
      if (pwd.a !== pwd.b) throw new Error("Parollar mos emas");
      const { error } = await supabase.auth.updateUser({ password: pwd.a });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Parol yangilandi");
      setPwd({ a: "", b: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeEmail = useMutation({
    mutationFn: async () => {
      if (!/^\S+@\S+\.\S+$/.test(newEmail)) throw new Error("Email noto'g'ri");
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tasdiqlash havolasi yangi emailingizga yuborildi");
      setNewEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="mt-6 h-72 rounded-2xl" />
      </div>
    );
  }

  const name = data.profile?.full_name ?? data.user.email ?? "Foydalanuvchi";
  const role = data.roles.includes("admin")
    ? "Admin"
    : data.roles.includes("premium")
      ? "Premium"
      : data.roles.includes("teacher")
        ? "O'qituvchi"
        : "Oddiy";

  const meta = [
    { l: "Ro'yxatdan o'tgan", v: data.profile?.created_at ? new Date(data.profile.created_at).toLocaleDateString("uz-UZ") : "—", i: CalendarDays },
    { l: "Oxirgi kirish", v: data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString("uz-UZ") : "—", i: UserRound },
    { l: "Sertifikatlar", v: data.certCount, i: Award },
    { l: "Ishlangan testlar", v: data.attemptCount, i: ListChecks },
    { l: "Umumiy ball (XP)", v: data.profile?.xp ?? 0, i: Sparkles },
  ];

  const input =
    "w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {form.avatar ? (
            <img
              src={form.avatar}
              alt={name}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground glow">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {data.user.email}
            </p>
            <span className="mt-2 inline-flex rounded-full border border-brand/40 bg-brand/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-brand">
              {role}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {meta.map((m) => (
            <div key={m.l} className="rounded-xl border border-border bg-background/40 p-3">
              <m.i className="h-4 w-4 text-brand" />
              <div className="mt-2 truncate text-sm font-semibold">{m.v}</div>
              <div className="text-[11px] text-muted-foreground">{m.l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
        >
          <h2 className="font-semibold">Shaxsiy ma'lumotlar</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Ism
              <input className={`mt-1 ${input}`} value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground">
              Familiya
              <input className={`mt-1 ${input}`} value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground">
              Login
              <input className={`mt-1 ${input}`} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground">
              Telefon (ixtiyoriy)
              <input className={`mt-1 ${input}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 ..." />
            </label>
            <label className="text-xs text-muted-foreground">
              Viloyat
              <input className={`mt-1 ${input}`} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Samarqand" />
            </label>
            <label className="text-xs text-muted-foreground">
              Tuman / shahar
              <input className={`mt-1 ${input}`} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Urgut" />
            </label>
            <label className="text-xs text-muted-foreground">
              Maktab
              <input className={`mt-1 ${input}`} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="12-maktab" />
            </label>
            <label className="text-xs text-muted-foreground">
              Mamlakat
              <input className={`mt-1 ${input}`} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="O'zbekiston" />
            </label>
            <label className="text-xs text-muted-foreground sm:col-span-2">
              Profil rasmi (URL)
              <input className={`mt-1 ${input}`} value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://..." />
            </label>

          </div>
          <button
            type="submit"
            disabled={save.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Saqlash
          </button>
        </form>

        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              changePassword.mutate();
            }}
            className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
          >
            <h2 className="flex items-center gap-2 font-semibold">
              <KeyRound className="h-4 w-4 text-brand" /> Parolni o'zgartirish
            </h2>
            <input type="password" className={`mt-3 ${input}`} placeholder="Yangi parol" value={pwd.a} onChange={(e) => setPwd({ ...pwd, a: e.target.value })} />
            <input type="password" className={`mt-2 ${input}`} placeholder="Parolni takrorlang" value={pwd.b} onChange={(e) => setPwd({ ...pwd, b: e.target.value })} />
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="mt-3 rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-secondary disabled:opacity-50"
            >
              Yangilash
            </button>
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              changeEmail.mutate();
            }}
            className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
          >
            <h2 className="flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4 text-brand" /> Emailni o'zgartirish
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Yangi emailga tasdiqlash havolasi yuboriladi.
            </p>
            <input className={`mt-3 ${input}`} placeholder="yangi@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <button
              type="submit"
              disabled={changeEmail.isPending}
              className="mt-3 rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-secondary disabled:opacity-50"
            >
              Tasdiqlash yuborish
            </button>
          </form>
        </div>
      </div>

      <DevicesCard />
    </div>
  );
}

function DevicesCard() {
  const qc = useQueryClient();
  const currentKey = typeof window === "undefined" ? "" : getDeviceKey();

  const { data: devices, isLoading } = useQuery({
    queryKey: ["my-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_devices")
        .select("id, device_key, device_name, browser, os, is_mobile, last_seen_at, created_at")
        .order("last_seen_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Qurilma ro'yxatdan olib tashlandi");
      qc.invalidateQueries({ queryKey: ["my-devices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <h2 className="flex items-center gap-2 font-semibold">
        <Laptop className="h-4 w-4 text-brand" /> Qurilmalar
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Hisobingiz ochilgan qurilmalar ro'yxati.
      </p>

      {isLoading ? (
        <Skeleton className="mt-4 h-24 rounded-xl" />
      ) : !devices?.length ? (
        <p className="mt-4 text-sm text-muted-foreground">Hozircha qurilma yozuvi yo'q.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {devices.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary">
                {d.is_mobile ? (
                  <Smartphone className="h-4 w-4 text-brand" />
                ) : (
                  <Laptop className="h-4 w-4 text-brand" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {d.device_name}
                  {d.device_key === currentKey && (
                    <span className="ml-2 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[10px] uppercase text-brand">
                      Shu qurilma
                    </span>
                  )}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  Oxirgi faollik: {new Date(d.last_seen_at).toLocaleString("uz-UZ")}
                </div>
              </div>
              {d.device_key !== currentKey && (
                <button
                  onClick={() => remove.mutate(d.id)}
                  disabled={remove.isPending}
                  className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  aria-label="Qurilmani o'chirish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

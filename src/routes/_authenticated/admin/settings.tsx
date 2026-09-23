import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [{ title: "Sayt sozlamalari — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettings,
});

type General = {
  site_name: string;
  author: string;
  contact_email: string;
  location: string;
  registration_open: boolean;
  maintenance: boolean;
};

const DEFAULTS: General = {
  site_name: "StartEdu",
  author: "Mirzaxon Ravshanov",
  contact_email: "hello@startedu.uz",
  location: "O'zbekiston, Samarqand",
  registration_open: true,
  maintenance: false,
};

function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<General>(DEFAULTS);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "general")
        .maybeSingle();
      if (error) throw error;
      return { ...DEFAULTS, ...((data?.value as Partial<General>) ?? {}) } as General;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "general", value: form, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sozlamalar saqlandi");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input =
    "w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand";

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Settings className="h-5 w-5 text-brand" /> Sayt sozlamalari
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Platformaning umumiy sozlamalari.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-6 max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Sayt nomi
            <input className={`mt-1 ${input}`} value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
          </label>
          <label className="text-xs text-muted-foreground">
            Muallif
            <input className={`mt-1 ${input}`} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </label>
          <label className="text-xs text-muted-foreground">
            Aloqa email
            <input className={`mt-1 ${input}`} value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </label>
          <label className="text-xs text-muted-foreground">
            Manzil
            <input className={`mt-1 ${input}`} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
        </div>

        <div className="mt-5 space-y-3">
          {(
            [
              { k: "registration_open" as const, l: "Ro'yxatdan o'tish ochiq", d: "Yangi foydalanuvchilar ro'yxatdan o'ta oladi." },
              { k: "maintenance" as const, l: "Texnik ishlar rejimi", d: "Saytda banner ko'rsatiladi." },
            ]
          ).map((t) => (
            <label key={t.k} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 p-3">
              <span>
                <span className="text-sm font-medium">{t.l}</span>
                <span className="block text-xs text-muted-foreground">{t.d}</span>
              </span>
              <input
                type="checkbox"
                checked={form[t.k]}
                onChange={(e) => setForm({ ...form, [t.k]: e.target.checked })}
                className="h-5 w-5 accent-[var(--brand)]"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={save.isPending}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Saqlash
        </button>
      </form>
    </div>
  );
}

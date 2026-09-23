import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/modules")({
  head: () => ({
    meta: [{ title: "Yo'nalishlar va modullar — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminModules,
});

const DIRECTIONS = [
  { v: "milliy-sertifikat", l: "Milliy sertifikat" },
  { v: "dtm", l: "DTM" },
  { v: "attestatsiya", l: "Attestatsiya" },
  { v: "oddiy", l: "Oddiy testlar" },
  { v: "video", l: "Video darslar" },
];

type Form = {
  id?: string;
  direction: string;
  title: string;
  slug: string;
  description: string;
  sort_order: string;
  is_published: boolean;
};

const EMPTY: Form = {
  direction: DIRECTIONS[0]!.v,
  title: "",
  slug: "",
  description: "",
  sort_order: "0",
  is_published: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AdminModules() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*, topics(count)")
        .order("direction")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (form.title.trim().length < 2) throw new Error("Modul nomi juda qisqa");
      const payload = {
        direction: form.direction,
        title: form.title.trim(),
        slug: (form.slug.trim() || slugify(form.title)) || `modul-${Date.now()}`,
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      };
      const res = form.id
        ? await supabase.from("modules").update(payload).eq("id", form.id)
        : await supabase.from("modules").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Saqlandi");
      setForm(EMPTY);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-modules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-modules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input =
    "w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand";

  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, m) => {
    (acc[m.direction] ??= [] as never)!.push(m);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yo'nalishlar boshqaruvi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Yo'nalish → Modul (bob) → Mavzu → Test tuzilmasi.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY);
            setShowForm((s) => !s);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground glow"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Yopish" : "Yangi modul"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Yo'nalish
              <select
                className={`mt-1 ${input}`}
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value })}
              >
                {DIRECTIONS.map((d) => (
                  <option key={d.v} value={d.v}>
                    {d.l}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Modul nomi
              <input className={`mt-1 ${input}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground">
              Slug (ixtiyoriy)
              <input className={`mt-1 ${input}`} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="avtomatik" />
            </label>
            <label className="text-xs text-muted-foreground">
              Tartib raqami
              <input className={`mt-1 ${input}`} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground sm:col-span-2">
              Tavsif
              <textarea rows={2} className={`mt-1 ${input}`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            Nashr qilingan
          </label>
          <div>
            <button
              type="submit"
              disabled={save.isPending}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-50"
            >
              {form.id ? "Yangilash" : "Yaratish"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([dir, mods]) => (
            <section key={dir}>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {DIRECTIONS.find((d) => d.v === dir)?.l ?? dir}
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(mods ?? []).map((m) => (
                  <div key={m.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium">
                          <Layers className="h-4 w-4 shrink-0 text-brand" />
                          <span className="truncate">{m.title}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {m.description ?? m.slug}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => {
                            setForm({
                              id: m.id,
                              direction: m.direction,
                              title: m.title,
                              slug: m.slug,
                              description: m.description ?? "",
                              sort_order: String(m.sort_order),
                              is_published: m.is_published,
                            });
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Modulni o'chirasizmi?")) remove.mutate(m.id);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {(m.topics as unknown as { count: number }[] | null)?.[0]?.count ?? 0} mavzu
                      </span>
                      {!m.is_published && (
                        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">
                          Nofaol
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {!data?.length && (
            <p className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              Hozircha modul yo'q. Birinchi modulni yarating.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

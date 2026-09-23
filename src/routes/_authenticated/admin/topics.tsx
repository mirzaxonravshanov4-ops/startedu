import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/topics")({
  head: () => ({ meta: [{ title: "Mavzular — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTopics,
});

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const CATEGORIES = [
  { value: "mavzulashtirilgan", label: "Mavzulashtirilgan" },
  { value: "milliy-sertifikat", label: "Milliy sertifikat" },
  { value: "dtm", label: "DTM" },
  { value: "attestatsiya", label: "Attestatsiya" },
  { value: "olimpiada", label: "Olimpiada" },
  { value: "sat", label: "SAT" },
  { value: "algebra", label: "Algebra" },
  { value: "geometriya", label: "Geometriya" },
  { value: "boshqa", label: "Boshqa" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

function AdminTopics() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<Category>("mavzulashtirilgan");
  const [moduleId, setModuleId] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);

  const { data: topics } = useQuery({
    queryKey: ["admin-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, slug, title, category, is_published, sort_order, modules(title, direction)")
        .order("category").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: modules } = useQuery({
    queryKey: ["admin-topic-modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("id, title, direction").order("direction").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const s = slug.trim() || slugify(title);
      if (!category) throw new Error("Turkumni tanlang");
      const { error } = await supabase.from("topics").insert({
        title, slug: s, category,
        module_id: moduleId || null, description: description || null, is_published: published,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mavzu qo'shildi");
      setTitle(""); setSlug(""); setDescription("");
      qc.invalidateQueries({ queryKey: ["admin-topics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-topics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Mavzular</h1>
      <p className="mt-1 text-sm text-muted-foreground">Yangi mavzu qo'shing yoki mavjudini boshqaring.</p>

      <form
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
        className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavha" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (ixtiyoriy)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <label className="grid gap-1 text-xs text-muted-foreground">
          Turkum (bo'lim)
          <select required value={category} onChange={(e) => { setCategory(e.target.value as Category); setModuleId(""); }} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Modul (ixtiyoriy)
          <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">Modulsiz</option>{(modules ?? []).map((m) => <option key={m.id} value={m.id}>{m.title} ({m.direction})</option>)}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Chop etilgan
        </label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tavsif" rows={2} className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
        <div className="sm:col-span-2">
          <Button disabled={create.isPending} className="rounded-full">
            <Plus className="h-4 w-4" /> Qo'shish
          </Button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Sarlavha</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Kategoriya</th>
              <th className="px-4 py-3 text-left">Holat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(topics ?? []).map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{t.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                <td className="px-4 py-3 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${t.is_published ? "bg-foreground/15 text-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {t.is_published ? "Chop etilgan" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="icon" onClick={() => confirm(`"${t.title}" o'chirilsinmi?`) && remove.mutate(t.id)} aria-label="O'chirish">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {(topics ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Hozircha mavzular yo'q.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

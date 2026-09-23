import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccessAlert } from "@/components/access-alert";
import type { AppError } from "@/lib/perm-error";
import { FilePlus2, PencilLine, ScrollText, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — StartEdu admin" },
      { name: "description", content: "Platformadagi barcha o'zgarishlar tarixi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditPage,
});

const ENTITIES = [
  { v: "all", l: "Barchasi" },
  { v: "topics", l: "Mavzular" },
  { v: "questions", l: "Savollar" },
  { v: "video_lessons", l: "Video darslar" },
  { v: "user_roles", l: "Rollar" },
  { v: "modules", l: "Modullar" },
];

const ACTION_META: Record<string, { l: string; cls: string; icon: typeof FilePlus2 }> = {
  create: { l: "Qo'shildi", cls: "border-foreground/40 bg-foreground/10 text-foreground", icon: FilePlus2 },
  update: { l: "O'zgartirildi", cls: "border-foreground/40 bg-foreground/10 text-foreground", icon: PencilLine },
  delete: { l: "O'chirildi", cls: "border-destructive/40 bg-destructive/10 text-destructive", icon: Trash2 },
};

function AuditPage() {
  const [entity, setEntity] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs", entity],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("id, actor_id, action, entity, entity_id, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (entity !== "all") q = q.eq("entity", entity);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ScrollText className="h-6 w-6 text-brand" /> Audit log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kim, qachon va nimani o'zgartirgani — oxirgi 200 ta yozuv.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ENTITIES.map((e) => (
            <button
              key={e.v}
              onClick={() => setEntity(e.v)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                entity === e.v
                  ? "border-brand/50 bg-brand/10 text-brand"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {e.l}
            </button>
          ))}
        </div>
      </header>

      <AccessAlert error={error as AppError} />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Hozircha yozuvlar yo'q.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {(data ?? []).map((row) => {
            const meta = ACTION_META[row.action] ?? ACTION_META['update']!;
            const Icon = meta.icon;
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
              >
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${meta.cls}`}>
                  <Icon className="h-3.5 w-3.5" /> {meta.l}
                </span>
                <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  {ENTITIES.find((e) => e.v === row.entity)?.l ?? row.entity}
                </span>
                <span className="min-w-0 flex-1 truncate">{row.summary || row.entity_id}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString("uz-UZ")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

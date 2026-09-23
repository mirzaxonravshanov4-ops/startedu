import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SUBJECT } from "@/lib/subject";
import { BarChart3, Bot, BookOpen, FileUp, GraduationCap, Layers, LayoutGrid, ListChecks, ScrollText, Settings, Users, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/$subject/dashboard", params: { subject: DEFAULT_SUBJECT } });
    return { isAdmin };
  },
  component: AdminLayout,
});

const groups = [
  {
    title: "Umumiy",
    items: [
      { to: "/admin" as const, label: "Statistika", icon: LayoutGrid, exact: true },
      { to: "/admin/results" as const, label: "Test natijalari", icon: BarChart3 },
    ],
  },
  {
    title: "Kontent",
    items: [
      { to: "/admin/modules" as const, label: "Yo'nalishlar", icon: Layers },
      { to: "/admin/topics" as const, label: "Mavzular", icon: BookOpen },
      { to: "/admin/questions" as const, label: "Savollar", icon: ListChecks },
      { to: "/admin/videos" as const, label: "Video darslar", icon: Video },
      { to: "/admin/import" as const, label: "LaTeX / import", icon: FileUp },
      { to: "/admin/ai-generator" as const, label: "AI savol yaratuvchi", icon: Bot },
    ],
  },
  {
    title: "Tizim",
    items: [
      { to: "/admin/users" as const, label: "Foydalanuvchilar", icon: Users },
      { to: "/admin/audit" as const, label: "Audit log", icon: ScrollText },
      { to: "/admin/settings" as const, label: "Sozlamalar", icon: Settings },
    ],
  },
];

function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Admin panel
          </div>
          <nav className="flex flex-col gap-4">
            {groups.map((g) => (
              <div key={g.title}>
                <div className="px-3 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  {g.title}
                </div>
                <div className="flex flex-wrap gap-1 lg:flex-col">
                  {g.items.map((it) => (
                    <Link
                      key={it.to}
                      to={it.to}
                      activeOptions={{ exact: "exact" in it ? it.exact : false }}
                      className="inline-flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground lg:flex-none"
                      activeProps={{ className: "bg-secondary text-foreground" }}
                    >
                      <it.icon className="h-4 w-4" /> {it.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

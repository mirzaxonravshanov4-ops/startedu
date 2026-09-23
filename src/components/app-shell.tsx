import { Link, useRouterState } from "@tanstack/react-router";
import { recordCurrentDevice } from "@/lib/device";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, LogOut, Menu, Sigma, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { visibleNavGroups } from "@/lib/nav";
import { useSubject } from "@/lib/subject";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteFooter } from "@/components/site-footer";
import { CalculatorFab } from "@/components/calculator-fab";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary glow">
        <Sigma className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="text-base font-semibold tracking-tight">
          Start<span className="gradient-text">Edu</span>
        </span>
      )}
    </Link>
  );
}

function ProfileMenu() {
  const { user, profile, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/auth"
          className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
        >
          Kirish
        </Link>
        <Link
          to="/auth"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground glow transition-transform hover:scale-[1.02]"
        >
          Boshlash
        </Link>
      </div>
    );
  }

  const name = profile?.full_name ?? user.email ?? "Profil";
  const initials = String(name).trim().slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-border py-1.5 pl-1.5 pr-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground">
          {initials}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-popover p-2 shadow-[var(--shadow-soft)] duration-150 animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {roles.length ? roles.join(", ") : "student"}
            </p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <UserRound className="h-4 w-4" /> Profil
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { roles } = useAuth();
  const subject = useSubject();
  const groups = visibleNavGroups(roles, subject);

  return (
    <nav className="flex flex-col gap-5 px-3 pb-8">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            {g.title}
          </div>
          <div className="space-y-0.5">
            {g.items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                params={it.scoped ? { subject } : {}}
                onClick={onNavigate}
                activeOptions={{ exact: it.exact }}
                className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{
                  className: "bg-secondary text-foreground font-medium",
                }}
              >
                <it.icon className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{it.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function useSessionSetup() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    recordCurrentDevice(user.id).catch(() => {});
  }, [user]);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useSessionSetup();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden lg:block">
              <Brand />
            </div>
            <button
              onClick={() => {
                setOpen((o) => !o);
                setMobileOpen((o) => !o);
              }}
              aria-label="Menyuni ochish/yopish"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-border/60 bg-surface/40 transition-[width] duration-300 lg:block ${
            open ? "w-64" : "w-0"
          }`}
        >
          <div className={`${open ? "block" : "hidden"} pt-4`}>
            <SidebarNav />
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="glass absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-border/60 pt-4 duration-200 animate-in slide-in-from-left">
              <div className="mb-2 px-4">
                <Brand />
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </div>
      <CalculatorFab />
    </div>
  );
}

import { useSubject } from "@/lib/subject";
import { Link } from "@tanstack/react-router";
import { Crown, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders children only for premium (or admin) users.
 * Used by SAT / Olimpiada / Attestatsiya directions.
 */
export function PremiumGate({ title, children }: { title: string; children: ReactNode }) {
  const subject = useSubject();
  const { isPremium, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)] sm:p-12">
          <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(70%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_18%,transparent),transparent)]" />
          <div className="relative">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground glow">
              <Crown className="h-6 w-6" />
            </span>
            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Sizda yetarlicha ruxsat yo'q. Bu bo'lim testlarini ishlash uchun{" "}
              <span className="font-medium text-foreground">Premium</span> sotib oling.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <a
                href="https://t.me/m1x080_v"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow"
              >
                <Lock className="h-4 w-4" /> Premium olish — @m1x080_v
              </a>
              <Link to="/$subject/topics" params={{ subject }}
                className="rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-secondary"
              >
                Bepul testlar
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

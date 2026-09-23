import { Book, Crown, Flame, Medal, Sparkles, Target, Trophy } from "lucide-react";
import type { Badge } from "@/lib/gamification";

const ICONS = {
  sparkles: Sparkles,
  flame: Flame,
  trophy: Trophy,
  medal: Medal,
  target: Target,
  crown: Crown,
  book: Book,
} as const;

export function BadgesGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
      {badges.map((b) => {
        const Icon = ICONS[b.icon];
        return (
          <div
            key={b.id}
            className={`rounded-2xl border p-4 transition-all ${
              b.earned
                ? "border-brand/40 bg-brand/5"
                : "border-border bg-card opacity-60"
            }`}
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${
                b.earned ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="mt-3 text-sm font-semibold">{b.title}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{b.description}</div>
          </div>
        );
      })}
    </div>
  );
}

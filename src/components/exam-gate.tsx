import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  LayoutGrid,
  ListChecks,
  Loader2,
  Lock,
  Maximize,
  ShieldAlert,
} from "lucide-react";
import type { ExamLockState } from "@/hooks/use-exam-lock";


type Props = {
  lock: ExamLockState;
  title: string;
  description?: string | null;
  questionCount: number;
  durationMinutes: number;
  backTo?: { to: string; params?: Record<string, string>; label: string };
};

/** Test boshlanishidan oldingi ekran: qoidalar + "Boshlash" (fullscreen). */
export function ExamStartScreen({
  lock,
  title,
  description,
  questionCount,
  durationMinutes,
  backTo,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Nazorat rejimi
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background/40 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ListChecks className="h-4 w-4 text-brand" /> Savollar
            </div>
            <div className="mt-1 text-lg font-semibold">{questionCount} ta</div>
          </div>
          <div className="rounded-2xl border border-border bg-background/40 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 text-brand" /> Vaqt
            </div>
            <div className="mt-1 text-lg font-semibold">{durationMinutes} daqiqa</div>
          </div>
        </div>

        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          <li>• Test to'liq ekran (full screen) rejimida o'tadi.</li>
          <li>• Boshqa oyna yoki ilovaga o'tish qoidabuzarlik sifatida qayd etiladi.</li>
          <li>• Nusxalash, chop etish va ishlab chiquvchi vositalari bloklanadi.</li>
          <li>• Vaqt tugaganda javoblar avtomatik saqlanadi.</li>
        </ul>

        <button
          onClick={() => void lock.start()}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow"
        >
          <Maximize className="h-4 w-4" /> Testni boshlash
        </button>
        {backTo && (
          <Link
            to={backTo.to}
            params={backTo.params ?? {}}
            className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {backTo.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/** Foydalanuvchi to'liq ekrandan chiqsa — testni bloklovchi qoplama. */
export function ExamLockOverlay({ lock }: { lock: ExamLockState }) {
  if (!lock.active || lock.fullscreen) return null;
  return (
    <div className="fixed inset-0 z-100 grid place-items-center bg-background/95 p-6 backdrop-blur-md">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Test bloklandi</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          To'liq ekran rejimidan chiqdingiz. Testni davom ettirish uchun qaytishingiz kerak.
          Qoidabuzarliklar soni: <span className="font-semibold text-foreground">{lock.violations}</span>
        </p>
        <button
          onClick={() => void lock.resume()}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow"
        >
          <Maximize className="h-4 w-4" /> Testga qaytish
        </button>
      </div>
    </div>
  );
}

/** Yuqorida turuvchi kichik nazorat indikatori. */
export function ExamLockBadge({ lock }: { lock: ExamLockState }) {
  if (!lock.active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
      <Lock className="h-3 w-3" /> Nazorat
      {lock.violations > 0 && <span className="text-destructive">· {lock.violations}</span>}
    </span>
  );
}

/* ================= Imtihon chrome: taymer, savol raqamlari, yakunlash ================= */

/** Ekran tepasida turuvchi taymer paneli (sticky). */
export function ExamTopBar({
  lock,
  title,
  time,
  lowTime,
  current,
  total,
  answered,
}: {
  lock: ExamLockState;
  title: string;
  time: string;
  lowTime?: boolean;
  current: number;
  total: number;
  answered: number;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-muted-foreground">
            Savol {current} / {total} · Belgilangan: {answered}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExamLockBadge lock={lock} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums ${
              lowTime
                ? "border-destructive/60 bg-destructive/10 text-destructive"
                : "border-border bg-background"
            }`}
          >
            <Clock className="h-4 w-4" /> {time}
          </span>
        </div>
      </div>
      <div className="h-1 w-full bg-secondary">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Pastda turuvchi savol raqamlari paneli.
 * Belgilangan — ko'k, belgilanmagan — oq, joriy savol — qora.
 */
export function ExamQuestionBar({
  total,
  current,
  isAnswered,
  onJump,
  onFinish,
  submitting,
}: {
  total: number;
  current: number;
  isAnswered: (index: number) => boolean;
  onJump: (index: number) => void;
  onFinish: () => void;
  submitting?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const answeredCount = Array.from({ length: total }, (_, i) => isAnswered(i)).filter(Boolean).length;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-3 sm:pt-2.5">
        <div className="flex items-center justify-between gap-2 pb-1.5">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Savollar {answeredCount}/{total}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onFinish}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground glow disabled:opacity-60 sm:text-sm"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Yakunlash
          </button>
        </div>

        <div
          className={
            open
              ? "grid max-h-[38vh] grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-1 overflow-y-auto"
              : "flex snap-x gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          }
        >
          {Array.from({ length: total }, (_, i) => {
            const active = i === current;
            const answered = isAnswered(i);
            const cls = active
              ? "border-foreground bg-foreground text-background"
              : answered
                ? "border-brand bg-brand text-primary-foreground"
                : "border-border bg-background text-foreground";
            return (
              <button
                key={i}
                type="button"
                onClick={() => onJump(i)}
                aria-label={`Savol ${i + 1}`}
                aria-current={active ? "true" : undefined}
                ref={
                  active
                    ? (el) => el?.scrollIntoView({ block: "nearest", inline: "center" })
                    : undefined
                }
                className={`h-8 w-8 shrink-0 snap-center rounded-md border text-[11px] font-semibold tabular-nums transition-colors ${cls}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/** Yakunlashdan oldingi ogohlantirish oynasi. */
export function ExamFinishDialog({
  open,
  total,
  answered,
  submitting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  total: number;
  answered: number;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  const left = total - answered;
  return (
    <div className="fixed inset-0 z-100 grid place-items-center bg-background/80 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-elegant)]">
        <ShieldAlert className="mx-auto h-9 w-9 text-destructive" />
        <h2 className="mt-3 text-lg font-semibold">Testni yakunlaysizmi?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {left > 0
            ? `${left} ta savol belgilanmagan. Yakunlangandan keyin javoblarni o'zgartirish mumkin emas.`
            : "Barcha savollar belgilangan. Yakunlangandan keyin javoblarni o'zgartirish mumkin emas."}
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Yakunlash
          </button>
        </div>
      </div>
    </div>
  );
}

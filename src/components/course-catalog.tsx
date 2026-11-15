import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Crown, Layers, Lock, Search, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { CONTACT } from "@/lib/contact";

export type CatalogItem = { id: string; node: ReactNode };
export type CatalogCourse = {
  id: string;
  title: string;
  description?: string | null;
  isPro: boolean;
  itemLabel: string;
  items: CatalogItem[];
};

/** Module/kurs "Pro" ekanini aniqlash: slug "pro-" bilan boshlansa yoki nomida "Pro" so'zi bo'lsa. */
export function isProModule(m: { slug?: string | null; title?: string | null }) {
  return (m.slug ?? "").toLowerCase().startsWith("pro-") || /(^|\s|\[)pro(\]|\s|$)/i.test(m.title ?? "");
}

const SYMBOLS = ["∑", "π", "∫", "√", "∞", "Δ", "θ", "ƒ"];

export function CourseCover({ title, index, pro }: { title: string; index: number; pro: boolean }) {
  return (
    <div className={`course-cover ${pro ? "is-pro" : ""} v${index % 3}`} role="img" aria-label={title}>
      <div className="cover-grid" />
      <div className="cover-orbit" />
      <span className="cover-label">StartEdu · {String(index + 1).padStart(2, "0")}</span>
      <span className="cover-symbol">{SYMBOLS[index % SYMBOLS.length]}</span>
    </div>
  );
}

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  courses: CatalogCourse[] | undefined;
  isLoading: boolean;
  emptyText: string;
};

export function CourseCatalog({ eyebrow, title, description, badge, courses, isLoading, emptyText }: Props) {
  const { isPremium } = useAuth();
  const [access, setAccess] = useState<"free" | "pro">("free");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (courses ?? []).filter(
      (c) => c.isPro === (access === "pro") && (!n || c.title.toLowerCase().includes(n)),
    );
  }, [courses, access, q]);

  const open = (courses ?? []).find((c) => c.id === openId);
  const openIndex = open ? (courses ?? []).indexOf(open) : 0;

  if (open) {
    const locked = open.isPro && !isPremium;
    return (
      <div className="learn-page mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <button onClick={() => setOpenId(null)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kurslarga qaytish
        </button>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{open.title}</h1>
            {open.description && <p className="mt-3 text-muted-foreground">{open.description}</p>}
            {locked ? (
              <div className="mt-8 rounded-2xl border border-pro/40 bg-pro/5 p-8 text-center">
                <Crown className="mx-auto h-9 w-9 text-pro" />
                <h3 className="mt-3 text-lg font-bold">Bu Pro kurs</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Pro kurslar premium obunaga kiradi. Premium olish uchun biz bilan bog'laning.
                </p>
                <a href={`https://t.me/${CONTACT.telegram.replace("@", "")}`} target="_blank" rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pro px-5 py-2.5 text-sm font-semibold text-pro-foreground">
                  <Lock className="h-4 w-4" /> Pro olish — {CONTACT.telegram}
                </a>
              </div>
            ) : open.items.length ? (
              <div className="mt-8 grid gap-3">{open.items.map((i) => <div key={i.id}>{i.node}</div>)}</div>
            ) : (
              <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Bu kursga hali {open.itemLabel} qo'shilmagan.
              </p>
            )}
          </div>
          <aside className="h-fit overflow-hidden rounded-2xl border border-border bg-card">
            <CourseCover title={open.title} index={openIndex} pro={open.isPro} />
            <div className="p-5">
              <h3 className="font-bold">Kurs dasturi</h3>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" /> {open.items.length} ta {open.itemLabel}
              </div>
              <span className={`access-tag mt-3 ${open.isPro ? "pro" : ""}`}>
                {open.isPro ? <><Crown className="h-3 w-3" /> Pro</> : <><Sparkles className="h-3 w-3" /> Bepul</>}
              </span>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{description}</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold sm:inline-flex">
          <BookOpen className="h-3.5 w-3.5 text-brand" /> {badge}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <button className={`category-choice ${access === "free" ? "selected" : ""}`} onClick={() => setAccess("free")}>
          <span className="choice-icon"><BookOpen className="h-6 w-6" /></span>
          <span><strong>Bepul kurslar</strong><small>Bilim sari birinchi qadam</small></span>
          <ChevronRight className="h-5 w-5" />
        </button>
        <button className={`category-choice pro ${access === "pro" ? "selected" : ""}`} onClick={() => setAccess("pro")}>
          <span className="choice-icon"><Crown className="h-6 w-6" /></span>
          <span><strong>Pro kurslar</strong><small>Chegarasiz imkoniyatlar</small></span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 flex justify-end">
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kursni qidirish…" aria-label="Kursni qidirish"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand" />
        </label>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      ) : visible.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => {
            const idx = (courses ?? []).indexOf(c);
            return (
              <button key={c.id} onClick={() => setOpenId(c.id)}
                className="course-card group text-left">
                <CourseCover title={c.title} index={idx} pro={c.isPro} />
                <div className="p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">{eyebrow}</span>
                  <h3 className="mt-1.5 text-lg font-bold leading-snug">{c.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {c.description || "Yangi bilimlarni bosqichma-bosqich egallang."}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" /> {c.items.length} ta {c.itemLabel}
                    </span>
                    <span className={`access-tag ${c.isPro ? "pro" : ""}`}>
                      {c.isPro ? <><Crown className="h-3 w-3" /> Pro</> : <><Sparkles className="h-3 w-3" /> Bepul</>}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {access === "pro" ? "Pro kurslar hozircha qo'shilmagan." : emptyText}
        </div>
      )}
    </div>
  );
}

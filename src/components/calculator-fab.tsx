import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Delete, Minus, X } from "lucide-react";
import { create, all } from "mathjs";

const math = create(all, { number: "number" });

type Mode = "deg" | "rad";

const BASIC: string[][] = [
  ["7", "8", "9", "(", ")"],
  ["4", "5", "6", "/", "^"],
  ["1", "2", "3", "*", "sqrt("],
  ["0", ".", "%", "-", "+"],
];

const SCI: string[] = [
  "sin(",
  "cos(",
  "tan(",
  "asin(",
  "acos(",
  "atan(",
  "log(",
  "log10(",
  "abs(",
  "exp(",
  "nthRoot(",
  "!",
  "pi",
  "e",
  "mod",
  "C(",
];

/** O'ng pastdagi suzuvchi kalkulyator: sodda amallardan oliy matematikagacha. */
export function CalculatorFab() {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState("");
  const [mode, setMode] = useState<Mode>("deg");
  const [history, setHistory] = useState<{ e: string; r: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const scope = useMemo(() => ({ ans: 0 }), []);

  const preview = useMemo(() => {
    if (!expr.trim()) return "";
    try {
      return format(evaluate(expr, mode, scope));
    } catch {
      return "";
    }
  }, [expr, mode, scope]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function push(token: string) {
    setExpr((v) => v + token);
    inputRef.current?.focus();
  }

  function equals() {
    if (!expr.trim()) return;
    try {
      const out = format(evaluate(expr, mode, scope));
      scope.ans = Number(out) || 0;
      setHistory((h) => [{ e: expr, r: out }, ...h].slice(0, 12));
      setExpr(out);
    } catch (err) {
      setHistory((h) =>
        [{ e: expr, r: err instanceof Error ? "Xato: " + err.message : "Xato" }, ...h].slice(0, 12),
      );
    }
  }

  function symbolic(kind: "derivative" | "simplify") {
    if (!expr.trim()) return;
    try {
      const out =
        kind === "derivative"
          ? math.derivative(expr, "x").toString()
          : math.simplify(expr).toString();
      setHistory((h) => [{ e: `${kind}(${expr})`, r: out }, ...h].slice(0, 12));
      setExpr(out);
    } catch {
      setHistory((h) => [{ e: expr, r: "Xato: ifodani tekshiring" }, ...h].slice(0, 12));
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Kalkulyator"
        className="fixed bottom-5 right-5 z-[70] grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Calculator className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-elegant)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Kalkulyator
            </span>
            <div className="flex items-center gap-1 rounded-full border border-border p-0.5 text-[10px]">
              {(["deg", "rad"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full px-2 py-0.5 uppercase ${
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <input
            ref={inputRef}
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                equals();
              }
            }}
            placeholder="2+2, sin(30), derivative uchun x^2 ..."
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-right font-mono text-lg outline-none focus:border-brand"
          />
          <div className="mt-1 h-5 text-right font-mono text-xs text-muted-foreground">
            {preview && `= ${preview}`}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {SCI.map((s) => (
              <button
                key={s}
                onClick={() => push(s === "mod" ? " mod " : s)}
                className="rounded-lg border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-secondary"
              >
                {s.replace("(", "")}
              </button>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1">
            <button
              onClick={() => symbolic("derivative")}
              className="rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-secondary"
            >
              d/dx (hosila)
            </button>
            <button
              onClick={() => symbolic("simplify")}
              className="rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-secondary"
            >
              Soddalashtirish
            </button>
          </div>

          <div className="mt-2 grid grid-cols-5 gap-1">
            {BASIC.flat().map((k) => (
              <button
                key={k}
                onClick={() => push(k)}
                className="rounded-xl border border-border py-2 font-mono text-sm hover:bg-secondary"
              >
                {k.replace("(", "")}
              </button>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-4 gap-1">
            <button
              onClick={() => setExpr("")}
              className="rounded-xl border border-destructive/40 py-2 text-xs text-destructive hover:bg-destructive/10"
            >
              AC
            </button>
            <button
              onClick={() => setExpr((v) => v.slice(0, -1))}
              className="grid place-items-center rounded-xl border border-border py-2 hover:bg-secondary"
              aria-label="O'chirish"
            >
              <Delete className="h-4 w-4" />
            </button>
            <button
              onClick={() => push("ans")}
              className="rounded-xl border border-border py-2 font-mono text-xs hover:bg-secondary"
            >
              ans
            </button>
            <button
              onClick={equals}
              className="rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground"
            >
              =
            </button>
          </div>

          {!!history.length && (
            <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto border-t border-border pt-2 text-[11px]">
              {history.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-2 font-mono">
                  <span className="truncate text-muted-foreground">{h.e}</span>
                  <button onClick={() => setExpr(h.r)} className="shrink-0 text-brand">
                    {h.r}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Minus className="h-3 w-3" /> matritsa, kompleks son, birlik va integral funksiyalari ham
            qo'llab-quvvatlanadi (mas. det([[1,2],[3,4]])).
          </p>
        </div>
      )}
    </>
  );
}

function evaluate(expr: string, mode: Mode, scope: Record<string, unknown>) {
  const src =
    mode === "deg"
      ? expr.replace(/\b(sin|cos|tan)\(/g, "$1(unit(").replace(/\bunit\(/g, "unit(")
      : expr;
  if (mode === "deg") {
    return math.evaluate(degWrap(expr), scope);
  }
  return math.evaluate(src, scope);
}

/** deg rejimida trigonometrik argumentlarni gradusga o'giradi. */
function degWrap(expr: string) {
  return expr
    .replace(/\b(sin|cos|tan)\(/g, "$1(DEG*")
    .replace(/\b(asin|acos|atan)\(/g, "(1/DEG)*$1(")
    .replace(/\bDEG\b/g, "(pi/180)");
}

function format(value: unknown) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return String(value);
    return String(Number(value.toFixed(10)));
  }
  return math.format(value, { precision: 12 });
}

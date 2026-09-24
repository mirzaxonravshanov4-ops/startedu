/** Visual laboratory scene model + a tiny safe math expression evaluator. */

export type View = { xmin: number; xmax: number; ymin: number; ymax: number };

export type Shape =
  | { kind: "axes"; xlabel?: string; ylabel?: string }
  | { kind: "grid" }
  | { kind: "func"; expr: string; color?: string; label?: string; from?: number; to?: number; dashed?: boolean }
  | { kind: "point"; x: number; y: number; label?: string; color?: string }
  | { kind: "segment"; x1: number; y1: number; x2: number; y2: number; label?: string; color?: string; dashed?: boolean }
  | { kind: "arrow"; x1: number; y1: number; x2: number; y2: number; label?: string; color?: string }
  | { kind: "polygon"; points: [number, number][]; label?: string; color?: string; fill?: boolean }
  | { kind: "circle"; cx: number; cy: number; r: number; label?: string; color?: string; fill?: boolean }
  | { kind: "label"; x: number; y: number; text: string; color?: string }
  | {
      kind: "numberline";
      min: number;
      max: number;
      step?: number;
      marks?: { x: number; label?: string; open?: boolean }[];
      interval?: { from: number; to: number; openFrom?: boolean; openTo?: boolean };
    }
  | { kind: "bars"; items: { label: string; value: number }[]; color?: string }
  | { kind: "pie"; items: { label: string; value: number }[] }
  | { kind: "fractionbar"; parts: number; filled: number; label?: string };

export type SceneStep = {
  title: string;
  narration: string;
  latex?: string;
  view?: View;
  shapes: Shape[];
  /** seconds; player clamps it */
  duration?: number;
};

export type Scene = {
  difficulty?: string;
  title: string;
  summary: string;
  answer?: string;
  steps: SceneStep[];
};

export const DEFAULT_VIEW: View = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };

/* ------------------------------------------------------------------ */
/* Tiny expression evaluator: numbers, x, + - * / ^ %, ( ), functions. */
/* ------------------------------------------------------------------ */

const FUNCS: Record<string, (n: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  cbrt: Math.cbrt,
};

type Tok = { t: "num" | "id" | "op" | "("; v: string } | { t: ")"; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const s = src.replace(/\s+/g, "");
  while (i < s.length) {
    const c = s[i]!;
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j]!)) j++;
      out.push({ t: "num", v: s.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j]!)) j++;
      out.push({ t: "id", v: s.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/^%".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "(") {
      out.push({ t: "(", v: c });
      i++;
      continue;
    }
    if (c === ")") {
      out.push({ t: ")", v: c });
      i++;
      continue;
    }
    if (c === ",") {
      out.push({ t: "op", v: "," });
      i++;
      continue;
    }
    throw new Error(`bad char ${c}`);
  }
  return out;
}

/** Recursive-descent parser producing a closure of x. */
export function compileExpr(src: string): (x: number) => number {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p];
    if (!t || (v !== undefined && t.v !== v)) throw new Error("parse error");
    p++;
    return t;
  };

  type Node = (x: number) => number;

  function primary(): Node {
    const t = peek();
    if (!t) throw new Error("eof");
    if (t.t === "op" && t.v === "-") {
      eat();
      const inner = unary();
      return (x) => -inner(x);
    }
    if (t.t === "op" && t.v === "+") {
      eat();
      return unary();
    }
    if (t.t === "num") {
      eat();
      const n = Number(t.v);
      return () => n;
    }
    if (t.t === "id") {
      eat();
      const name = t.v.toLowerCase();
      if (peek()?.t === "(") {
        eat("(");
        const arg = expr();
        eat(")");
        const f = FUNCS[name];
        if (!f) throw new Error("unknown fn");
        return (x) => f(arg(x));
      }
      if (name === "x") return (x) => x;
      if (name === "pi") return () => Math.PI;
      if (name === "e") return () => Math.E;
      throw new Error("unknown id");
    }
    if (t.t === "(") {
      eat("(");
      const e = expr();
      eat(")");
      return e;
    }
    throw new Error("parse error");
  }

  function unary(): Node {
    return primary();
  }

  function power(): Node {
    const base = unary();
    const t = peek();
    if (t && t.t === "op" && t.v === "^") {
      eat();
      const ex = power();
      return (x) => Math.pow(base(x), ex(x));
    }
    return base;
  }

  function term(): Node {
    let left = power();
    for (;;) {
      const t = peek();
      if (t && t.t === "op" && (t.v === "*" || t.v === "/" || t.v === "%")) {
        eat();
        const right = power();
        const op = t.v;
        const l = left;
        left = (x) => (op === "*" ? l(x) * right(x) : op === "/" ? l(x) / right(x) : l(x) % right(x));
        continue;
      }
      // implicit multiplication: 2x, 3(x+1), x sqrt(2)
      if (t && (t.t === "num" || t.t === "id" || t.t === "(")) {
        const right = power();
        const l = left;
        left = (x) => l(x) * right(x);
        continue;
      }
      return left;
    }
  }

  function expr(): Node {
    let left = term();
    for (;;) {
      const t = peek();
      if (t && t.t === "op" && (t.v === "+" || t.v === "-")) {
        eat();
        const right = term();
        const op = t.v;
        const l = left;
        left = (x) => (op === "+" ? l(x) + right(x) : l(x) - right(x));
        continue;
      }
      return left;
    }
  }

  const fn = expr();
  if (p !== toks.length) throw new Error("trailing tokens");
  return (x: number) => {
    const v = fn(x);
    return Number.isFinite(v) ? v : NaN;
  };
}

export function safeCompile(src: string): ((x: number) => number) | null {
  try {
    const f = compileExpr(src);
    f(1);
    return f;
  } catch {
    return null;
  }
}

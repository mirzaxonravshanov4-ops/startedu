import "katex/dist/katex.min.css";
import katex from "katex";
import { useMemo } from "react";
import { repairLatexString } from "@/lib/latex-fix";

/**
 * Renders text containing LaTeX. Supports $...$, $$...$$, \( ... \) and \[ ... \].
 * Malformed formulas never crash the page — KaTeX renders them in error color instead.
 */
export function LatexText({ children, className }: { children: string; className?: string }) {
  const parts = useMemo(() => parseLatex(normalizeSource(children ?? "")), [children]);

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.type === "text") {
          return (
            <span key={i} style={{ whiteSpace: "pre-wrap" }}>
              {p.value}
            </span>
          );
        }
        return (
          <span
            key={i}
            style={p.type === "block" ? { display: "block", margin: "0.5em 0" } : undefined}
            dangerouslySetInnerHTML={{ __html: render(p.value, p.type === "block") }}
          />
        );
      })}
    </span>
  );
}

type Part = { type: "text" | "inline" | "block"; value: string };

const MACROS: Record<string, string> = {
  "\\R": "\\mathbb{R}",
  "\\N": "\\mathbb{N}",
  "\\Z": "\\mathbb{Z}",
  "\\Q": "\\mathbb{Q}",
  "\\deg": "^\\circ",
};

function render(math: string, display: boolean): string {
  const cleaned = cleanMath(math);
  try {
    return katex.renderToString(cleaned, {
      displayMode: display,
      throwOnError: false,
      errorColor: "#f87171",
      strict: false,
      // Never trust user-authored formulas: this blocks \href, \includegraphics
      // and \html* commands that could inject arbitrary HTML or javascript: links.
      trust: false,
      macros: MACROS,
    });
  } catch {
    return escapeHtml(math);
  }
}

/** Normalizes delimiters and escaping problems coming from AI output / the database. */
function normalizeSource(input: string): string {
  let s = repairLatexString(input);
  // Literal "\\n" / "\\t" produced by double-encoded JSON
  s = s.replace(/\\r\\n|\\n/g, "\n").replace(/\\t/g, "\t");
  // \[ ... \] -> $$ ... $$   and   \( ... \) -> $ ... $
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_m, g) => `$$${g}$$`);
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, g) => `$${g}$`);
  // ```math / ```latex fenced blocks
  s = s.replace(/```(?:math|latex)\n([\s\S]*?)```/g, (_m, g) => `$$${g}$$`);
  return s;
}

/** Fixes the most common malformed-LaTeX patterns before handing them to KaTeX. */
function cleanMath(input: string): string {
  let s = input.trim();
  // Double-escaped commands: \\frac -> \frac (but keep intentional line breaks "\\ ")
  if (/\\\\[a-zA-Z]/.test(s)) s = s.replace(/\\\\([a-zA-Z]+)/g, "\\$1");
  // Unicode operators KaTeX would choke on
  s = s
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/−/g, "-")
    .replace(/·/g, "\\cdot ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/∞/g, "\\infty ")
    .replace(/√/g, "\\sqrt ")
    .replace(/°/g, "^\\circ ")
    .replace(/[“”«»]/g, '"');
  // Balance \left ... \right
  const left = (s.match(/\\left/g) ?? []).length;
  const right = (s.match(/\\right/g) ?? []).length;
  if (left > right) s += "\\right.".repeat(left - right);
  if (right > left) s = "\\left.".repeat(right - left) + s;
  // Stray "$" left inside math and bare "\\" at the end
  s = s.replace(/\$/g, "").replace(/\\+$/, "");
  // Balance braces
  const open = (s.match(/(?<!\\)\{/g) ?? []).length;
  const close = (s.match(/(?<!\\)\}/g) ?? []).length;
  if (open > close) s += "}".repeat(open - close);
  return s;
}

function parseLatex(input: string): Part[] {
  const parts: Part[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: "text", value: input.slice(lastIndex, m.index) });
    }
    if (m[1] !== undefined) parts.push({ type: "block", value: m[1].trim() });
    else if (m[2] !== undefined) parts.push({ type: "inline", value: m[2].trim() });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < input.length) {
    parts.push({ type: "text", value: input.slice(lastIndex) });
  }
  return parts;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

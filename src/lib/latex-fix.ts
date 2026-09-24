/**
 * AI models often write LaTeX inside JSON with single backslashes ("\frac", "\times").
 * JSON treats \f, \t, \n, \r, \b as control characters, so formulas break silently.
 * These helpers repair both the raw JSON text and already-parsed strings.
 */

// LaTeX commands that start with a JSON escape letter (b, f, n, r, t, u).
const JSON_ESCAPE_CMDS = [
  "frac", "dfrac", "tfrac", "forall", "flat",
  "times", "text", "textbf", "textit", "textrm", "tan", "tanh", "theta", "Theta", "tau", "to", "top", "triangle", "tilde", "tfrac",
  "neq", "ne", "nabla", "neg", "notin", "nu", "nmid", "nleq", "ngeq", "newline",
  "right", "rightarrow", "Rightarrow", "rho", "rm", "rangle", "rceil", "rfloor", "rvert",
  "beta", "bar", "binom", "bmod", "big", "Big", "bigg", "Bigg", "bigcup", "bigcap", "boxed", "bot", "bullet", "backslash", "begin", "bf", "boldsymbol",
  "underline", "cup", "uparrow", "Uparrow", "upsilon",
];
const CMD_RE = new RegExp(`^(?:${[...new Set(JSON_ESCAPE_CMDS)].sort((a, b) => b.length - a.length).join("|")})(?![a-zA-Z])`);

/** Fixes invalid/ambiguous backslashes in raw JSON text produced by a model. */
export function repairJsonLatex(raw: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < raw.length; i += 1) {
    const c = raw[i]!;
    if (c === '"') {
      // count preceding backslashes
      let k = i - 1;
      let n = 0;
      while (k >= 0 && raw[k] === "\\") { n += 1; k -= 1; }
      if (n % 2 === 0) inString = !inString;
      out += c;
      continue;
    }
    if (inString && c === "\\") {
      const next = raw[i + 1] ?? "";
      if (next === "\\") { out += "\\\\"; i += 1; continue; }
      if (next === '"' || next === "/") { out += c + next; i += 1; continue; }
      const rest = raw.slice(i + 1, i + 20);
      if ("bfnrtu".includes(next) && next !== "" ) {
        if (CMD_RE.test(rest)) { out += "\\\\"; continue; }
        if (next === "u" && /^u[0-9a-fA-F]{4}/.test(rest)) { out += c; continue; }
        if (next === "u") { out += "\\\\"; continue; }
        out += c; // genuine \n, \t ...
        continue;
      }
      // Any other escape (\sqrt, \alpha, \{, \,) is invalid JSON — double it.
      out += "\\\\";
      continue;
    }
    out += c;
  }
  return out;
}

/** Repairs control characters already baked into parsed strings (also fixes old DB data). */
export function repairLatexString(s: string): string {
  return s
    .replace(/\f/g, "\\f")
    .replace(/\x08/g, "\\b")
    .replace(/\t(?=[a-zA-Z])/g, "\\t")
    .replace(/\r(?=ight|ho|angle|m\b)/g, "\\r")
    .replace(/\v/g, "\\v");
}

/** Deep-repairs every string inside a parsed JSON value. */
export function repairDeep<T>(v: T): T {
  if (typeof v === "string") return repairLatexString(v) as T;
  if (Array.isArray(v)) return v.map(repairDeep) as T;
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) o[k] = repairDeep(val);
    return o as T;
  }
  return v;
}

/** Parses the first JSON object in a model reply, repairing LaTeX escapes. */
export function parseModelJson(raw: string): unknown {
  const text = raw.trim().replace(/^```(?:json)?/i, "").replace(/```\s*$/, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  for (const candidate of [repairJsonLatex(slice), slice]) {
    try {
      return repairDeep(JSON.parse(candidate));
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Rule text added to every AI prompt that returns JSON with LaTeX. */
export const LATEX_JSON_RULES = `LaTeX QOIDALARI (juda muhim):
- JSON ichida har bir LaTeX teskari chizig'ini IKKITA yozing: "\\\\frac{1}{2}", "\\\\sqrt{x}", "\\\\times".
- Formulalarni faqat $...$ (inline) yoki $$...$$ (blok) ichida yozing; \\\\( \\\\) va \\\\[ \\\\] ishlatmang.
- Har bir $ ochilsa yopilsin, har bir { ga } bo'lsin, \\\\left bilan \\\\right juft bo'lsin.
- Unicode belgilar (×, ÷, √, ≤, ≥, ≠, π) o'rniga LaTeX buyruqlarini yozing: \\\\times, \\\\div, \\\\sqrt{}, \\\\le, \\\\ge, \\\\ne, \\\\pi.
- Oddiy matnni $...$ ichiga qo'ymang; o'zbekcha so'zlar formuladan tashqarida bo'lsin.
- Pul belgisi uchun $ ishlatmang (so'm yozing).`;

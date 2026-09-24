import { LATEX_JSON_RULES, parseModelJson } from "@/lib/latex-fix";

export type ImportedQuestion = {
  body: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  image_url?: string | null;
  options: { body: string; is_correct: boolean }[];
};

export const IMPORT_SYSTEM_PROMPT = `Siz — StartEdu platformasi uchun SAVOL IMPORT PARSERISIZ.
Sizga LaTeX, Word yoki PDF dan olingan xom matn beriladi. Undan test savollarini ajratib, tuzilmali JSON qaytarasiz.

QAT'IY:
- Faqat JSON qaytaring: {"questions":[{"body":"...","explanation":"...","difficulty":"easy|medium|hard","options":[{"body":"...","is_correct":true},...]}]}
- Matematik ifodalarni LaTeX ko'rinishida saqlang: inline $...$ va blok $$...$$.
- \\begin{enumerate}, \\item, \\choice, A) B) C) D), 1) 2) kabi belgilarni savol/variant sifatida to'g'ri tushunib, ularni body ichida QOLDIRMANG.
- To'g'ri javob \\correct, *, (to'g'ri), "Javob: B" kabi belgilar bilan ko'rsatilgan bo'lsa, uni is_correct=true qiling.
- Agar to'g'ri javob ko'rsatilmagan bo'lsa, masalani o'zingiz yechib, to'g'ri variantni belgilang.
- Har bir savolda 2-6 variant bo'lsin va aynan bittasi to'g'ri bo'lsin.
- explanation — qisqa (1-3 gap) o'zbekcha izoh, LaTeX bilan.
- Matndagi savol soni so'ralganidan kam bo'lsa, bor savollarnigina qaytaring; yangi savol o'ylab topmang.

${LATEX_JSON_RULES}`;

/** Parses and normalizes the model's JSON reply. */
export function parseImportJson(raw: string): ImportedQuestion[] {
  const obj = parseModelJson(raw);
  if (!obj) return [];
  const list = (obj as { questions?: unknown[] })?.questions;
  if (!Array.isArray(list)) return [];

  const out: ImportedQuestion[] = [];
  for (const it of list) {
    const q = it as Partial<ImportedQuestion>;
    const body = typeof q.body === "string" ? q.body.trim() : "";
    const opts = Array.isArray(q.options)
      ? q.options
          .filter((o) => o && typeof o.body === "string" && o.body.trim())
          .map((o) => ({ body: String(o.body).trim(), is_correct: Boolean(o.is_correct) }))
      : [];
    if (!body || opts.length < 2) continue;
    if (!opts.some((o) => o.is_correct)) opts[0]!.is_correct = true;
    let seen = false;
    for (const o of opts) {
      if (o.is_correct && seen) o.is_correct = false;
      if (o.is_correct) seen = true;
    }
    out.push({
      body,
      explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
      difficulty: q.difficulty === "easy" || q.difficulty === "hard" ? q.difficulty : "medium",
      image_url: typeof q.image_url === "string" && q.image_url.trim() ? q.image_url.trim() : null,
      options: opts,
    });
  }
  return out;
}

/** Offline fallback parser for the simple plain-text format (no AI needed). */
export function parsePlainFormat(src: string): ImportedQuestion[] {
  const blocks = src
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const out: ImportedQuestion[] = [];
  for (const b of blocks) {
    const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;
    const bodyLines: string[] = [];
    const options: { body: string; is_correct: boolean }[] = [];
    let explanation = "";
    for (const line of lines) {
      if (/^=/.test(line)) {
        explanation = line.replace(/^=\s*/, "");
        continue;
      }
      const m = /^(\*?)\s*([A-DA-Za-z])[).]\s*(.+)$/.exec(line);
      if (m && (options.length > 0 || bodyLines.length > 0)) {
        options.push({ body: m[3]!.trim(), is_correct: m[1] === "*" });
        continue;
      }
      bodyLines.push(line.replace(/^\d+[).]\s*/, ""));
    }
    if (!bodyLines.length || options.length < 2) continue;
    if (!options.some((o) => o.is_correct)) options[0]!.is_correct = true;
    out.push({ body: bodyLines.join(" "), explanation, difficulty: "medium", options });
  }
  return out;
}

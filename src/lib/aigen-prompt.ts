import type { ImportedQuestion } from "@/lib/import-prompt";

export type GeneratedWritten = {
  body: string;
  mode: "open" | "short";
  expected_answer: string;
  solution: string;
  difficulty: "easy" | "medium" | "hard";
  max_score: number;
};

export type GenLanguage = "uz" | "en";

const LANG_LABEL: Record<GenLanguage, string> = {
  uz: "o'zbek tilida (lotin yozuvida)",
  en: "in English only",
};

export function testSystemPrompt(lang: GenLanguage): string {
  return `You are StartEdu's expert math test-item writer.
Write questions ${LANG_LABEL[lang]}.

STRICT OUTPUT — return ONLY JSON, no markdown fences:
{"questions":[{"body":"...","explanation":"...","difficulty":"easy|medium|hard","options":[{"body":"...","is_correct":true},{"body":"...","is_correct":false}]}]}

Rules:
- Exactly 4 options per question, exactly ONE correct.
- All math in LaTeX: inline $...$, display $$...$$.
- Distractors must come from realistic student mistakes, never random numbers.
- Every question must be solvable from its text alone — no images or figures.
- "explanation" is a short worked solution (1-4 sentences) in the same language.
- No duplicated or paraphrased questions inside one response.
- Respect the requested difficulty and the admin's instruction exactly.`;
}

export function writtenSystemPrompt(lang: GenLanguage): string {
  return `You are StartEdu's expert writer of OPEN-ANSWER (written) math tasks.
Write tasks ${LANG_LABEL[lang]}.

STRICT OUTPUT — return ONLY JSON, no markdown fences:
{"tasks":[{"body":"...","mode":"short|open","expected_answer":"...","solution":"...","difficulty":"easy|medium|hard","max_score":5}]}

Rules:
- "mode":"short" — the answer is a single number/expression (write it in "expected_answer").
- "mode":"open" — a full written solution is expected; "expected_answer" holds the final result.
- "solution" is a complete step-by-step solution with LaTeX.
- All math in LaTeX: inline $...$, display $$...$$.
- max_score between 1 and 20.
- No images or figures; the task must be solvable from its text.`;
}

function jsonSlice(raw: string): unknown {
  const text = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseGeneratedTests(raw: string): ImportedQuestion[] {
  const obj = jsonSlice(raw) as { questions?: unknown[] } | null;
  const list = Array.isArray(obj?.questions) ? obj!.questions! : [];
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
      image_url: null,
      options: opts,
    });
  }
  return out;
}

export function parseGeneratedWritten(raw: string): GeneratedWritten[] {
  const obj = jsonSlice(raw) as { tasks?: unknown[] } | null;
  const list = Array.isArray(obj?.tasks) ? obj!.tasks! : [];
  const out: GeneratedWritten[] = [];
  for (const it of list) {
    const t = it as Partial<GeneratedWritten>;
    const body = typeof t.body === "string" ? t.body.trim() : "";
    if (!body) continue;
    const score = Number(t.max_score);
    out.push({
      body,
      mode: t.mode === "open" ? "open" : "short",
      expected_answer: typeof t.expected_answer === "string" ? t.expected_answer.trim() : "",
      solution: typeof t.solution === "string" ? t.solution.trim() : "",
      difficulty: t.difficulty === "easy" || t.difficulty === "hard" ? t.difficulty : "medium",
      max_score: Number.isFinite(score) ? Math.min(20, Math.max(1, Math.round(score))) : 5,
    });
  }
  return out;
}

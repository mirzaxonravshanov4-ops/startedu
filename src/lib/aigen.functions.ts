import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "@/lib/ai-gateway";
import {
  parseGeneratedTests,
  parseGeneratedWritten,
  testSystemPrompt,
  writtenSystemPrompt,
} from "@/lib/aigen-prompt";

const InputSchema = z.object({
  instruction: z.string().min(3).max(4000),
  kind: z.enum(["test", "written"]).default("test"),
  language: z.enum(["uz", "en"]).default("uz"),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  count: z.number().int().min(1).max(100).default(10),
  topicTitle: z.string().max(200).optional(),
  section: z.enum(["matematika", "kasbiy", "pedagogika"]).optional(),
  avoid: z.array(z.string().max(400)).max(60).default([]),
  /** Text extracted from an uploaded file — questions are taken/adapted from it. */
  sourceText: z.string().max(120_000).optional(),
});

const SECTION_TEXT: Record<string, string> = {
  matematika: "Bo'lim: MATEMATIKA — maktab va oliy matematika mavzulari.",
  kasbiy:
    "Bo'lim: KASBIY STANDART — o'qituvchining kasbiy standarti, kompetensiyalari, huquq va burchlari, normativ hujjatlar bo'yicha savollar. Matematik masala EMAS.",
  pedagogika:
    "Bo'lim: PEDAGOGIK MAHORAT — metodika, didaktika, pedagogika va psixologiya, dars tashkil etish, baholash usullari bo'yicha savollar. Matematik masala EMAS.",
};

const DIFF_TEXT: Record<string, string> = {
  easy: "Barcha savollar OSON darajada bo'lsin.",
  medium: "Barcha savollar O'RTA darajada bo'lsin.",
  hard: "Barcha savollar QIYIN (imtihonning eng murakkab qismi) darajada bo'lsin.",
  mixed: "Darajalar aralash bo'lsin: taxminan 30% oson, 45% o'rta, 25% qiyin.",
};

/** Generates draft questions or written tasks for admin review. */
export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Rolni tekshirib bo'lmadi");
    if (!isAdmin) throw new Error("Faqat administrator uchun");

    const system =
      data.kind === "test" ? testSystemPrompt(data.language) : writtenSystemPrompt(data.language);

    const CHUNK = 10;
    const CONCURRENCY = 3;
    const MAX_ROUNDS = 6;
    const baseAvoid = data.avoid.slice(-60);
    let lastError = "";
    const src = data.sourceText?.trim();

    const buildPrompt = (want: number, variant: number, extraAvoid: string[]) =>
      [
        `Soni: aynan ${want} ta.`,
        data.topicTitle ? `Mavzu: ${data.topicTitle}.` : "",
        data.section ? SECTION_TEXT[data.section]! : "",
        DIFF_TEXT[data.difficulty] ?? "",
        `Admin buyrug'i: ${data.instruction}`,
        src
          ? `MANBA FAYL berilgan. Avvalo fayldagi savollarni aynan olib (xatolarini tuzatib, LaTeX ga o'tkazib) qaytaring; fayldagi savollar tugasa yoki kamlik qilsa, ular uslubida va shu mavzuda yangilarini tuzing. To'g'ri javob ko'rsatilmagan bo'lsa, o'zingiz yechib belgilang. Agar manba CSV jadval bo'lsa (vergul yoki nuqtali vergul bilan ajratilgan), har bir qator — bitta savol: ustunlar odatda savol, A/B/C/D variantlar, to'g'ri javob va izoh; sarlavha qatorini savol deb olmang.\n\nMANBA:\n${src.slice(0, 60_000)}`
          : `Variant #${variant}: bu to'plam boshqa to'plamlardan farq qilsin — turli sonlar, kontekst va yechim usullaridan foydalaning.`,
        [...baseAvoid, ...extraAvoid].length
          ? `Quyidagilar allaqachon mavjud — takrorlamang:\n${[...baseAvoid, ...extraAvoid]
              .slice(-60)
              .map((a) => `- ${a.slice(0, 160)}`)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

    async function runChunk(want: number, variant: number, extraAvoid: string[]): Promise<string> {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          return await chatCompletion({
            messages: [
              { role: "system", content: system },
              { role: "user", content: buildPrompt(want, variant, extraAvoid) },
            ],
            response_format: { type: "json_object" },
            max_tokens: 16000,
          });
        } catch (e) {
          lastError = e instanceof Error ? e.message : "AI xatosi";
          // Faqat vaqtinchalik xatolarda (chegara / server) kutib qayta urinamiz
          if (/kreditlari|kaliti|sozlanmagan/.test(lastError)) return "";
          await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt + Math.random() * 500));
        }
      }
      return "";
    }
    const seen = new Set<string>();
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const questions: ReturnType<typeof parseGeneratedTests> = [];
    const tasks: ReturnType<typeof parseGeneratedWritten> = [];

    const addRaw = (raw: string) => {
      if (!raw) return;
      if (data.kind === "test") {
        for (const q of parseGeneratedTests(raw)) {
          const k = norm(q.body);
          if (seen.has(k)) continue;
          seen.add(k);
          questions.push(q);
        }
      } else {
        for (const t of parseGeneratedWritten(raw)) {
          const k = norm(t.body);
          if (seen.has(k)) continue;
          seen.add(k);
          tasks.push(t);
        }
      }
    };
    const have = () => (data.kind === "test" ? questions.length : tasks.length);

    // Kerakli songa yetguncha bo'laklab so'raymiz (bir vaqtda 3 tadan — chegaraga urilmaslik uchun)
    let variant = 1;
    for (let round = 0; round < MAX_ROUNDS && have() < data.count; round += 1) {
      const need = data.count - have();
      const chunks: number[] = [];
      for (let left = need; left > 0; left -= CHUNK) chunks.push(Math.min(CHUNK, left));
      const recent = (data.kind === "test" ? questions : tasks).map((x) => x.body).slice(-30);
      for (let i = 0; i < chunks.length; i += CONCURRENCY) {
        const batch = chunks.slice(i, i + CONCURRENCY);
        const raws = await Promise.all(batch.map((want) => runChunk(want, variant++, recent)));
        raws.forEach(addRaw);
        if (have() >= data.count) break;
      }
      if (lastError && /kreditlari|kaliti|sozlanmagan/.test(lastError)) break;
    }

    if (data.kind === "test") {
      if (!questions.length) {
        throw new Error(lastError || "AI savol qaytarmadi — buyruqni aniqroq yozing");
      }
      return { kind: "test" as const, questions: questions.slice(0, data.count), tasks: [] };
    }

    if (!tasks.length) {
      throw new Error(lastError || "AI topshiriq qaytarmadi — buyruqni aniqroq yozing");
    }
    return { kind: "written" as const, questions: [], tasks: tasks.slice(0, data.count) };
  });


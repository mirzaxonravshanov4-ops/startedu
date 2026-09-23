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
  count: z.number().int().min(1).max(50).default(10),
  topicTitle: z.string().max(200).optional(),
  section: z.enum(["matematika", "kasbiy", "pedagogika"]).optional(),
  avoid: z.array(z.string().max(400)).max(40).default([]),
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

    // Katta so'rovlarni bo'laklarga bo'lamiz — bir javobda 8 tadan ko'p savol sifatsiz/uzilgan chiqadi.
    // Bo'laklar parallel yuboriladi, aks holda 50 ta savol so'rovi vaqt chegarasidan oshib ketadi.
    const CHUNK = 8;
    const chunks: number[] = [];
    let left = data.count;
    while (left > 0) {
      chunks.push(Math.min(CHUNK, left));
      left -= Math.min(CHUNK, left);
    }

    const baseAvoid = data.avoid.slice(-60);
    let lastError = "";

    const buildPrompt = (want: number, variant: number) =>
      [
        `Soni: ${want} ta.`,
        data.topicTitle ? `Mavzu: ${data.topicTitle}.` : "",
        data.section ? SECTION_TEXT[data.section]! : "",
        DIFF_TEXT[data.difficulty] ?? "",
        `Admin buyrug'i: ${data.instruction}`,
        `Variant #${variant}: bu to'plam boshqa to'plamlardan farq qilsin — turli sonlar, kontekst va yechim usullaridan foydalaning.`,
        baseAvoid.length
          ? `Quyidagilar allaqachon mavjud — takrorlamang:\n${baseAvoid
              .map((a) => `- ${a.slice(0, 160)}`)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

    async function runChunk(want: number, variant: number): Promise<string> {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          return await chatCompletion({
            messages: [
              { role: "system", content: system },
              { role: "user", content: buildPrompt(want, variant) },
            ],
            response_format: { type: "json_object" },
            max_tokens: 8000,
          });
        } catch (e) {
          lastError = e instanceof Error ? e.message : "AI xatosi";
          if (attempt === 1) return "";
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
      return "";
    }

    const raws = await Promise.all(chunks.map((want, i) => runChunk(want, i + 1)));

    const seen = new Set<string>();
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const questions: ReturnType<typeof parseGeneratedTests> = [];
    const tasks: ReturnType<typeof parseGeneratedWritten> = [];

    for (const raw of raws) {
      if (!raw) continue;
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


import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "@/lib/ai-gateway";
import { withAiQuota } from "@/lib/ai-quota.server";

const TutorSchema = z.object({
  subject: z.string().max(60).default("matematika"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(6000),
      }),
    )
    .min(1)
    .max(40),
});

/** AI ustoz — o'quvchi bilan erkin suhbatlashadigan matematika ustozi. */
export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => TutorSchema.parse(data))
  .handler(async ({ data, context }) => withAiQuota(context.supabase, async () => {
    const system = [
      `Sen StartEdu platformasining AI ustozisan. Fan: ${data.subject}.`,
      "O'zbek tilida, qisqa va tushunarli javob ber. O'quvchiga yo'l-yo'riq ko'rsat,",
      "kerak bo'lsa qadam-baqadam yechim yoz. Formulalarni oddiy matnda yoz.",
      "Javobing 250 so'zdan oshmasin.",
    ].join(" ");

    return chatCompletion({
      messages: [{ role: "system", content: system }, ...data.messages],
      max_tokens: 1200,
    });
  }));

const TwinSchema = z.object({
  subject: z.string().max(60).default("matematika"),
  goal: z.string().min(3).max(300),
  level: z.enum(["boshlang'ich", "o'rta", "yuqori"]).default("o'rta"),
  days: z.number().int().min(3).max(30).default(14),
});

/** AI Twin — o'quvchining maqsadiga mos shaxsiy o'quv rejasi tuzadi. */
export const generateTwinPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => TwinSchema.parse(data))
  .handler(async ({ data, context }) => withAiQuota(context.supabase, async () => {
    const prompt = [
      `Sen StartEdu platformasining AI Twin (shaxsiy repetitor) xizmatisan.`,
      `O'quvchi ma'lumotlari: fan — ${data.subject}, daraja — ${data.level},`,
      `maqsad — "${data.goal}", muddat — ${data.days} kun.`,
      `Ushbu ma'lumotlar asosida o'zbek tilida kunma-kun shaxsiy o'quv rejasi tuz.`,
      `Har bir kun uchun: mavzu, qisqa topshiriq va taxminiy vaqt (daqiqa) ko'rsat.`,
      `Reja amaliy va rag'batlantiruvchi ohangda bo'lsin. Markdown sarlavhalar ishlatma,`,
      `oddiy "1-kun: ..." formatida yoz.`,
    ].join(" ");

    return chatCompletion({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
    });
  }));

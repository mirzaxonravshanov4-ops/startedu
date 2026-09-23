import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LAB_SYSTEM_PROMPT, LAB_TOPICS, extractJson } from "@/lib/lab-prompt";
import { chatCompletion } from "@/lib/ai-gateway";


const InputSchema = z.object({
  question: z.string().min(3).max(2000),
  topic: z.string().max(120).optional(),
  /** Optional data URL of an uploaded image (photo of a task, drawing, etc). */
  image: z
    .string()
    .max(8_000_000)
    .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/)
    .optional(),
});

export { LAB_TOPICS };

/** Turns a math question into an animated visual scene (JSON) using Lovable AI. */
export const makeScene = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const user = [
      data.topic ? `Mavzu: ${data.topic}` : "",
      `Savol: ${data.question}`,
      data.image ? "Rasmda savol/masala berilgan — uni o'qib, aynan shu masalani yech." : "",
      "Faqat JSON qaytar.",
    ]
      .filter(Boolean)
      .join("\n");

    const userContent = data.image
      ? [
          { type: "text", text: user },
          { type: "image_url", image_url: { url: data.image } },
        ]
      : user;

    const content = await chatCompletion({
      messages: [
        { role: "system", content: LAB_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });

    const scene = extractJson(content);


    if (!scene || !Array.isArray(scene.steps) || scene.steps.length === 0) {
      throw new Error("Vizual sahna tuzilmadi, savolni aniqroq yozib ko'ring");
    }
    return { scene };
  });

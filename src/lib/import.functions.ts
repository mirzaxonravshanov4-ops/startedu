import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { IMPORT_SYSTEM_PROMPT, parseImportJson } from "@/lib/import-prompt";
import { chatCompletion } from "@/lib/ai-gateway";


const TextSchema = z.object({
  source: z.string().min(10).max(120_000),
  count: z.number().int().min(1).max(60).default(20),
});

const FileSchema = z.object({
  fileName: z.string().min(1).max(200),
  /** base64 (without data URL prefix) */
  base64: z.string().min(4).max(12_000_000),
});

/** Extracts raw text from an uploaded .docx / .tex / .txt / .pdf file. */
export const extractFileText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => FileSchema.parse(data))
  .handler(async ({ data }) => {
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const name = data.fileName.toLowerCase();

    if (name.endsWith(".docx")) {
      const { unzipSync, strFromU8 } = await import("fflate");
      const files = unzipSync(bytes);
      const doc = files["word/document.xml"];
      if (!doc) throw new Error("Word fayl tuzilmasi tanilmadi");
      const xml = strFromU8(doc);
      const text = xml
        .replace(/<\/w:p>/g, "\n")
        .replace(/<w:tab[^>]*\/>/g, "\t")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (!text) throw new Error("Faylda matn topilmadi");
      return { text };
    }

    if (name.endsWith(".pdf")) {
      // Extract text segments from uncompressed and Flate-compressed content streams.
      const { inflateSync, strFromU8 } = await import("fflate");
      const raw = new TextDecoder("latin1").decode(bytes);
      const chunks: string[] = [];
      const streamRe = /stream\r?\n([\s\S]*?)endstream/g;
      let m: RegExpExecArray | null;
      while ((m = streamRe.exec(raw))) {
        const seg = m[1] ?? "";
        let content = seg;
        try {
          const bin = Uint8Array.from(seg, (c) => c.charCodeAt(0) & 0xff);
          content = strFromU8(inflateSync(bin));
        } catch {
          /* not deflated — use as is */
        }
        const textRe = /\((?:\\.|[^\\)])*\)/g;
        let t: RegExpExecArray | null;
        let acc = "";
        while ((t = textRe.exec(content))) {
          acc += t[0].slice(1, -1).replace(/\\([()\\])/g, "$1");
        }
        if (acc.trim().length > 3) chunks.push(acc);
      }
      const text = chunks.join("\n").replace(/\s{3,}/g, " ").trim();
      if (text.length < 20)
        throw new Error("PDF matnini o'qib bo'lmadi (rasmli PDF). Matnni qo'lda joylashtiring yoki .docx yuklang.");
      return { text };
    }

    const text = new TextDecoder().decode(bytes).trim();
    if (!text) throw new Error("Faylda matn topilmadi");
    return { text };
  });

/** Converts free-form LaTeX / Word / PDF text into structured questions. */
export const parseQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => TextSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Faqat admin uchun");

    const content = await chatCompletion({
      messages: [
        { role: "system", content: IMPORT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Maksimal ${data.count} ta savol ajratib ol.\n\nMANBA:\n${data.source.slice(0, 100_000)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = parseImportJson(content);

    if (!parsed.length) throw new Error("Savollar ajratilmadi — formatni tekshirib ko'ring");
    return { questions: parsed.slice(0, data.count) };
  });

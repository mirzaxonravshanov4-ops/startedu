/**
 * Single place where every AI call goes out.
 * Uses the project's Gemini API key (Google's OpenAI-compatible endpoint),
 * and falls back to the Lovable AI Gateway when no Gemini key is configured.
 * Server-only: call from inside a server function handler.
 */

export const AI_MODEL_DEFAULT = "gemini-3.6-flash";

type ChatBody = {
  messages: unknown[];
  model?: string;
  response_format?: unknown;
  max_tokens?: number;
};

export async function chatCompletion(body: ChatBody): Promise<string> {
  const gemini = process.env["GEMINI_API_KEY"];
  const lovable = process.env["LOVABLE_API_KEY"];

  const url = gemini
    ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    : "https://ai.gateway.lovable.dev/v1/chat/completions";
  const apiKey = gemini ?? lovable;
  if (!apiKey) throw new Error("AI xizmati sozlanmagan");

  const model = body.model ?? (gemini ? AI_MODEL_DEFAULT : `google/${AI_MODEL_DEFAULT}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, model }),
  });

  if (res.status === 429) throw new Error("So'rovlar chegarasi oshib ketdi. Biroz kuting.");
  if (res.status === 402) throw new Error("AI kreditlari tugadi. Iltimos, keyinroq urinib ko'ring.");
  if (res.status === 401 || res.status === 403) throw new Error("AI kaliti qabul qilinmadi");
  if (!res.ok) {
    console.error("AI error", res.status, await res.text().catch(() => ""));
    throw new Error("AI xizmatida xatolik");
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * Single place where every AI call goes out — user's own Google Gemini key
 * (OpenAI-compatible Chat Completions endpoint, streamed).
 * Server-only: call from inside a server function handler.
 */

export const AI_MODEL_DEFAULT = "gemini-3.8-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

type Msg = { role: string; content: unknown };
type ChatBody = {
  messages: Msg[];
  model?: string;
  response_format?: unknown;
  max_tokens?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function chatCompletion(body: ChatBody): Promise<string> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("AI xizmati sozlanmagan");

  const wantsJson = (body.response_format as { type?: string } | undefined)?.type === "json_object";
  const messages = wantsJson
    ? [...body.messages, { role: "user", content: "Return the answer as valid JSON only." }]
    : body.messages;

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL_DEFAULT,
        messages,
        stream: true,
        ...(wantsJson ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (res.status !== 429 && res.status < 500) break;
    if (attempt < 2) await sleep(1500 * 2 ** attempt + Math.random() * 500);
  }
  if (!res) throw new Error("AI xizmatida xatolik");

  if (res.status === 429) throw new Error("So'rovlar chegarasi oshib ketdi. Biroz kuting.");
  if (res.status === 401 || res.status === 403) throw new Error("AI kaliti qabul qilinmadi");
  if (res.status >= 500) throw new Error("AI xizmati hozir band. Birozdan keyin urinib ko'ring.");
  if (!res.ok || !res.body) {
    console.error("AI error", res.status, await res.text().catch(() => ""));
    throw new Error("AI xizmatida xatolik");
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.error) {
          console.error("AI stream error", payload);
          throw new Error("AI xizmatida xatolik");
        }
        out += ev.choices?.[0]?.delta?.content ?? "";
      } catch (e) {
        if (e instanceof Error && e.message === "AI xizmatida xatolik") throw e;
      }
    }
  }
  return out;
}

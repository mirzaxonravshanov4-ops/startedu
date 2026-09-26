/**
 * Single place where every AI call goes out (Lovable AI Gateway, Responses API, streamed).
 * Server-only: call from inside a server function handler.
 */

export const AI_MODEL_DEFAULT = "openai/gpt-6-astra";

type Msg = { role: string; content: unknown };
type ChatBody = {
  messages: Msg[];
  model?: string;
  response_format?: unknown;
  max_tokens?: number;
};

function toInput(messages: Msg[]) {
  const instructions = messages
    .filter((m) => m.role === "system")
    .map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
    .join("\n\n");
  const input = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      if (typeof m.content === "string") {
        return {
          role: m.role,
          content: [{ type: m.role === "assistant" ? "output_text" : "input_text", text: m.content }],
        };
      }
      // OpenAI chat-style parts -> responses parts
      const parts = (Array.isArray(m.content) ? m.content : []).map((p: any) => {
        if (p?.type === "text") return { type: "input_text", text: p.text };
        if (p?.type === "image_url") return { type: "input_image", image_url: p.image_url?.url ?? p.image_url };
        return p;
      });
      return { role: m.role, content: parts };
    });
  return { instructions, input };
}

export async function chatCompletion(body: ChatBody): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI xizmati sozlanmagan");

  const { instructions, input } = toInput(body.messages);
  const wantsJson = (body.response_format as { type?: string } | undefined)?.type === "json_object";

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Lovable-API-Key": apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: AI_MODEL_DEFAULT,
      instructions: instructions || undefined,
      input: wantsJson ? [...input, { role: "user", content: [{ type: "input_text", text: "Return the answer as valid JSON only." }] }] : input,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      ...(wantsJson ? { text: { format: { type: "json_object" } } } : {}),
    }),
  });

  if (res.status === 429) throw new Error("So'rovlar chegarasi oshib ketdi. Biroz kuting.");
  if (res.status === 402) throw new Error("AI kreditlari tugadi. Iltimos, keyinroq urinib ko'ring.");
  if (res.status === 401 || res.status === 403) throw new Error("AI kaliti qabul qilinmadi");
  if (!res.ok || !res.body) {
    console.error("AI error", res.status, await res.text().catch(() => ""));
    throw new Error("AI xizmatida xatolik");
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  let finalText = "";
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
        if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
        else if (ev.type === "response.output_text.done" && ev.text) finalText += ev.text;
        else if (ev.type === "response.failed" || ev.type === "error") {
          console.error("AI stream error", payload);
          throw new Error("AI xizmatida xatolik");
        }
      } catch (e) {
        if (e instanceof Error && e.message === "AI xizmatida xatolik") throw e;
      }
    }
  }
  return out || finalText;
}

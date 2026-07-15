import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat/JSON model. Works with OpenAI ("gpt-4o-mini") or, via Anthropic's
// OpenAI-compatible endpoint, a Claude model ("claude-sonnet-4-6").
export const CHAT_MODEL = process.env.CHAT_MODEL || "claude-sonnet-5";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const AI_TIMEOUT_MS = 90_000;

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI timeout after ${ms}ms (${label})`)), ms)
    ),
  ]);
}

export async function chatWithAI(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    msgs.push({ role: "system", content: systemPrompt });
  }

  msgs.push(...messages.map((m) => ({ role: m.role, content: m.content })));

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: msgs,
        max_tokens: 1800,
      }),
      AI_TIMEOUT_MS,
      "chatWithAI"
    );
    return response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response right now.";
  } catch (err: any) {
    console.error("chatWithAI error:", err?.message ?? err);
    return "I had a moment of silence there — give me another go.";
  }
}

export async function generateJSON<T>(prompt: string, systemPrompt: string): Promise<T> {
  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt + "\n\nRespond with valid JSON only. No markdown, no explanation." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
      }),
      AI_TIMEOUT_MS,
      "generateJSON"
    );
    const raw = response.choices[0]?.message?.content ?? "{}";
    // Tolerate models that wrap JSON in ```json ... ``` fences or add stray prose.
    let text = raw.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/,"")
      .trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) text = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(text) as T;
  } catch (err: any) {
    console.error("generateJSON error:", err?.message ?? err);
    return {} as T;
  }
}

export { openai };

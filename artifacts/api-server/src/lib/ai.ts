import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const AI_TIMEOUT_MS = 45_000;

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
        model: "gpt-4o-mini",
        messages: msgs,
        max_tokens: 1800,
        temperature: 0.9,
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
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt + "\n\nRespond with valid JSON only. No markdown, no explanation." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
      AI_TIMEOUT_MS,
      "generateJSON"
    );
    const text = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(text) as T;
  } catch (err: any) {
    console.error("generateJSON error:", err?.message ?? err);
    return {} as T;
  }
}

export { openai };

import "server-only";
import { bardSystemPrompt, fallbackLines } from "./persona";

/** One short in-character reply from NEAR AI Cloud (OpenAI-compatible). */
export async function bardSay(prompt: string, name?: string): Promise<string> {
  const key = process.env.NEAR_AI_API_KEY;
  if (!key) return fallbackLines[0];
  try {
    const response = await fetch(`${process.env.NEAR_AI_BASE_URL ?? "https://cloud-api.near.ai/v1"}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.NEAR_AI_MODEL ?? "zai-org/GLM-5.1-FP8",
        temperature: 0.9,
        max_tokens: 220,
        messages: [
          { role: "system", content: bardSystemPrompt() },
          { role: "user", content: `${name ? `${name} says: ` : ""}${prompt.slice(0, 800)}` },
        ],
      }),
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`AI ${response.status}`);
    const data = await response.json();
    let text: string = data?.choices?.[0]?.message?.content ?? "";
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/[*_`#]/g, "").trim();
    return text.slice(0, 900) || fallbackLines[1];
  } catch {
    return fallbackLines[Math.floor(Math.random() * fallbackLines.length)];
  }
}

import "server-only";
import { bardSystemPrompt, bardExamples, fallbackLines } from "./persona";

const BASE = () => process.env.NEAR_AI_BASE_URL ?? "https://cloud-api.near.ai/v1";

// Best writers first. Matched against NEAR AI Cloud's public model list, so exact IDs need not be known.
const PREFERENCE = [/claude.*haiku.*5/i, /claude.*haiku/i, /kimi.*k3/i, /kimi/i, /qwen.*3\.[5-9].*(max|397)/i, /deepseek.*v4/i, /deepseek/i, /glm/i];
let chosen: { id: string; at: number } | null = null;

export async function bardModel(): Promise<string> {
  if (process.env.NEAR_AI_MODEL) return process.env.NEAR_AI_MODEL;
  if (chosen && Date.now() - chosen.at < 6 * 3600_000) return chosen.id;
  try {
    const data = await fetch(`${BASE()}/model/list?limit=200`, { signal: AbortSignal.timeout(6000), cache: "no-store" }).then(r => r.json());
    const ids: string[] = (data?.models ?? data?.data ?? []).map((m: Record<string, unknown>) => String(m.modelId ?? m.id ?? m.model_id ?? "")).filter(Boolean);
    for (const pattern of PREFERENCE) {
      const hit = ids.find(id => pattern.test(id));
      if (hit) { chosen = { id: hit, at: Date.now() }; return hit; }
    }
  } catch { /* fall back */ }
  return "zai-org/GLM-5.1-FP8";
}

/** One short in-character reply from NEAR AI Cloud (OpenAI-compatible). */
export async function bardSay(prompt: string, name?: string): Promise<string> {
  const key = process.env.NEAR_AI_API_KEY;
  if (!key) return fallbackLines[0];
  try {
    const response = await fetch(`${BASE()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: await bardModel(),
        temperature: 0.85,
        max_tokens: 350,
        messages: [
          { role: "system", content: bardSystemPrompt() },
          ...bardExamples,
          { role: "user", content: `${name ? `${name} says: ` : ""}${prompt.slice(0, 800)}` },
        ],
      }),
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    if (!response.ok) { chosen = null; throw new Error(`AI ${response.status}`); }
    const data = await response.json();
    let text: string = data?.choices?.[0]?.message?.content ?? "";
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/[*_`#]/g, "").trim();
    return text.slice(0, 900) || fallbackLines[1];
  } catch {
    return fallbackLines[Math.floor(Math.random() * fallbackLines.length)];
  }
}

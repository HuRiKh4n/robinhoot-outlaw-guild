import "server-only";

const BASE = () => process.env.NEAR_AI_BASE_URL ?? "https://cloud-api.near.ai/v1";
export const IMAGE_MODEL = () => process.env.NEAR_AI_IMAGE_MODEL ?? "black-forest-labs/FLUX.2-klein-4B";

/** Edit one of our own portraits with NEAR AI Cloud (image-to-image). Returns PNG/JPEG bytes. */
export async function editPortrait(base: ArrayBuffer, prompt: string, timeoutMs = 55000): Promise<Uint8Array> {
  const key = process.env.NEAR_AI_API_KEY;
  if (!key) throw new Error("NEAR_AI_API_KEY missing");
  const form = new FormData();
  form.append("model", IMAGE_MODEL());
  form.append("prompt", prompt);
  form.append("n", "1");
  form.append("response_format", "b64_json");
  form.append("image", new Blob([base], { type: "image/png" }), "base.png");
  const response = await fetch(`${BASE()}/images/edits`, {
    method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form,
    signal: AbortSignal.timeout(timeoutMs), cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`image edit ${response.status}: ${text.slice(0, 300)}`);
  const b64 = JSON.parse(text)?.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image in response");
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

export const imageType = (bytes: Uint8Array) => bytes[0] === 0x89 ? "image/png" : bytes[0] === 0xff ? "image/jpeg" : "image/webp";

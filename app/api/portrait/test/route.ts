import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE = () => process.env.NEAR_AI_BASE_URL ?? "https://cloud-api.near.ai/v1";
const SAFE = /^[a-z-]+$/;
/** Fixed examples anyone can open; results are cached by the CDN for a day, so each one is paid for once. */
const DEMOS: Record<string, string> = {
  "1": "species=fox&class=ranger&outfit=leather-vest&details=an eyepatch, a golden tooth and a small lute on the back",
  "2": "species=wolf&class=warrior&outfit=berserker&details=a scar across the eye and a necklace of gold coins",
  "3": "species=fox&class=ranger&outfit=leather-vest&mode=new&details=an eyepatch and a golden tooth",
  "4": "species=fox&class=ranger&outfit=leather-vest&full=Turn this fox into a big brown bear, an anthropomorphic bear outlaw with a round bear head, small round ears, thick brown fur and a short tail. Keep exactly the same outfit, same weapons, same pose, same painterly cinematic fantasy style, same dark grey smoky studio background and lighting, full body, centred. No text, no logos, no frame.",
  "5": "species=fox&class=warrior&outfit=battle-armor&full=Turn this fox into a big brown bear, an anthropomorphic bear warrior with a round bear head, small round ears, thick brown fur and a short tail. Keep exactly the same armour, same weapons, same pose, same painterly cinematic fantasy style, same dark grey smoky studio background and lighting, full body, centred. No text, no logos, no frame.",
  "7": "species=wolf&class=ranger&outfit=leather-vest&full=Turn this wolf into a huge grizzly bear outlaw: broad heavy bear head, small round ears, short muzzle, dark brown fur with grey streaks, a fierce cunning scowl, narrowed amber eyes, battle scars on the snout, bared teeth in a smirk, menacing and rough, NOT cute, NOT a teddy bear. Bears have no visible tail: remove the long bushy tail completely. Keep exactly the same outfit, same weapons, same pose, same painterly cinematic fantasy style with the same level of detail on the face as the original, same dark grey smoky studio background and lighting, full body, centred. No text, no logos, no frame.",
  "8": "species=wolf&class=warrior&outfit=battle-armor&full=Turn this wolf into a huge grizzly bear outlaw: broad heavy bear head, small round ears, short muzzle, dark brown fur with grey streaks, a fierce cunning scowl, narrowed amber eyes, battle scars on the snout, bared teeth in a smirk, menacing and rough, NOT cute, NOT a teddy bear. Bears have no visible tail: remove the long bushy tail completely. Keep exactly the same outfit, same weapons, same pose, same painterly cinematic fantasy style with the same level of detail on the face as the original, same dark grey smoky studio background and lighting, full body, centred. No text, no logos, no frame.",
  "6": "species=badger&class=mage&outfit=arcane-robes&full=Keep exactly the same honey badger mage: same face, same robes, same staff, same pose, same painterly style. Replace only the background and lighting with a plain dark grey smoky studio background and soft neutral studio light, like a character sheet. Full body, centred. No text, no logos, no frame.",
};

/** Private test of AI portraits built on our own base art.
 *  /api/portrait/test?secret=<TELEGRAM_WEBHOOK_SECRET>&list=1                → image models available
 *  /api/portrait/test?secret=...&species=fox&class=ranger&outfit=leather-vest&details=an eyepatch and a golden tooth
 *  add &mode=new to draw from text only (no base image), for comparison. */
export async function GET(request: NextRequest) {
  let q = request.nextUrl.searchParams;
  const demo = DEMOS[q.get("demo") ?? ""];
  if (demo) q = new URLSearchParams(demo);
  else if (q.get("models")) { /* public model list, no cost */ }
  else if (!process.env.TELEGRAM_WEBHOOK_SECRET || q.get("secret") !== process.env.TELEGRAM_WEBHOOK_SECRET)
    return NextResponse.json({ ok: false, hint: "try ?demo=1, 2 or 3" }, { status: 401 });
  const key = process.env.NEAR_AI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "NEAR_AI_API_KEY missing" }, { status: 500 });

  if (q.get("list") || request.nextUrl.searchParams.get("models")) {
    const data = await fetch(`${BASE()}/model/list?limit=300`, { cache: "no-store" }).then(r => r.json()).catch(e => ({ error: String(e) }));
    const models = (data?.models ?? data?.data ?? []) as Record<string, unknown>[];
    const pick = models.filter(m => /flux|image|diffusion|sdxl|qwen-image|imagen|seedream/i.test(JSON.stringify(m)));
    return NextResponse.json({ count: models.length, image: pick });
  }

  const species = q.get("species") ?? "fox", klass = q.get("class") ?? "ranger", outfit = q.get("outfit") ?? "leather-vest";
  if (![species, klass, outfit].every(v => SAFE.test(v))) return NextResponse.json({ ok: false, error: "bad params" }, { status: 400 });
  const details = (q.get("details") ?? "an eyepatch, a golden tooth and a small lute on the back").slice(0, 200);
  const model = q.get("model") ?? "black-forest-labs/FLUX.2-klein-4B";
  const animal = species === "badger" ? "honey badger" : species;
  const prompt = q.get("full") ?? (
    `Keep exactly the same ${animal} character: same face, same fur colours, same body, same pose, same outfit, same painterly cinematic fantasy style, ` +
    `same dark grey smoky studio background and lighting, full body, centred. Only add these personal details: ${details}. ` +
    `No text, no logos, no frame.`);

  const started = Date.now();
  let response: Response;
  if (q.get("mode") === "new") {
    response = await fetch(`${BASE()}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, n: 1, size: "768x1152", response_format: "b64_json",
        prompt: `Full body anthropomorphic ${animal} outlaw ${klass} in ${outfit.replace(/-/g, " ")}, medieval Robin Hood fantasy, painterly cinematic illustration, dark grey smoky studio background. Details: ${details}. No text.` }),
      signal: AbortSignal.timeout(55000), cache: "no-store",
    });
  } else {
    const baseUrl = new URL(`/characters/${species}/${klass}/${outfit}.png`, request.nextUrl.origin);
    const baseImage = await fetch(baseUrl, { cache: "no-store" });
    if (!baseImage.ok) return NextResponse.json({ ok: false, error: `base image not found: ${baseUrl.pathname}` }, { status: 404 });
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt);
    form.append("n", "1");
    form.append("response_format", "b64_json");
    form.append("image", new Blob([await baseImage.arrayBuffer()], { type: "image/png" }), "base.png");
    response = await fetch(`${BASE()}/images/edits`, {
      method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form,
      signal: AbortSignal.timeout(55000), cache: "no-store",
    });
  }
  const text = await response.text();
  if (!response.ok) return NextResponse.json({ ok: false, status: response.status, error: text.slice(0, 1500), model, seconds: (Date.now() - started) / 1000 }, { status: 502 });
  let b64 = "";
  try { const data = JSON.parse(text); b64 = data?.data?.[0]?.b64_json ?? ""; if (!b64 && data?.data?.[0]?.url) return NextResponse.redirect(data.data[0].url); } catch { /* fallthrough */ }
  if (!b64) return NextResponse.json({ ok: false, error: "no image in response", raw: text.slice(0, 800) }, { status: 502 });
  const bytes = Buffer.from(b64, "base64");
  return new NextResponse(bytes, { headers: { "Content-Type": bytes[0] === 0x89 ? "image/png" : "image/jpeg", "Cache-Control": demo ? "public, s-maxage=86400" : "no-store", "X-Seconds": String((Date.now() - started) / 1000) } });
}

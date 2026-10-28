import { NextRequest, NextResponse } from "next/server";
import { editPortrait, imageType } from "@/lib/portrait/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** One-off art job: repaint ONLY the background of the portraits whose backdrop does not match the rest.
 *  Fixed list, results cached by the CDN for a week, so each image is paid for once.
 *  GET /api/portrait/restyle?file=badger/mage/arcane-robes   (list: ?list=1) */
const SPECIES: Record<string, string> = { badger: "honey badger", rabbit: "rabbit", wolf: "wolf" };
const FILES = [
  ...["badger", "rabbit"].flatMap(s => [
    "mage/arcane-robes", "mage/dark-sorcerer", "mage/mystic-hood",
    "ranger/forest-hood", "ranger/leather-vest", "ranger/patched-cloak",
    "rogue/assassin-gear", "rogue/shadow-hood", "rogue/thief-cloak",
    "scout/dust-hood", "scout/wanderer-pack",
    "trickster/card-sharp", "trickster/jester-motley",
    "warrior/battle-armor", "warrior/berserker", "warrior/royal-guard",
  ].map(f => `${s}/${f}`)),
  "wolf/scout/dust-hood", "wolf/scout/wanderer-pack", "wolf/trickster/card-sharp", "wolf/trickster/jester-motley",
];

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  if (q.get("list")) return NextResponse.json(FILES);
  const file = q.get("file") ?? "";
  if (!FILES.includes(file)) return NextResponse.json({ ok: false, error: "not in the list" }, { status: 404 });
  const [species, klass] = file.split("/");
  const base = await fetch(new URL(`/characters/${file}.png`, request.nextUrl.origin), { cache: "no-store" });
  if (!base.ok) return NextResponse.json({ ok: false, error: "base image missing" }, { status: 404 });
  const prompt =
    `Keep exactly the same ${SPECIES[species]} ${klass}: same face, same fur, same expression, same outfit, same weapons and props, same pose, same painterly cinematic fantasy style and detail. ` +
    `Replace only the background and the lighting: a plain dark grey smoky studio background with soft neutral dramatic studio light, ` +
    `like a character sheet, no coloured sky, no fire, no landscape, no ground scenery. Full body, centred. No text, no logos, no frame.`;
  try {
    const bytes = await editPortrait(await base.arrayBuffer(), prompt);
    return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": imageType(bytes), "Cache-Control": "public, s-maxage=604800" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error).slice(0, 400) }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { RULES, SOUL_V1 } from "@/lib/council/texts";
export const dynamic = "force-static";
/** Tobias's fixed rules (never voted) and the starting SOUL (?file=soul). */
export async function GET(request: Request) {
  const soul = new URL(request.url).searchParams.get("file") === "soul";
  return new NextResponse(soul ? SOUL_V1 : RULES, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

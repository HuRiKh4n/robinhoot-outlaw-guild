import { NextResponse } from "next/server";
import { identityConfig } from "@/lib/identity/server";
import { councilBrief } from "@/lib/council/core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
/** Plain-text brief that Tobias (IronClaw) fetches every run: SOUL in force, mission, open votes. */
export async function GET() {
  if (!identityConfig()) return new NextResponse("The Council is not open yet. Keep the tavern warm and tell the tale.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  try {
    return new NextResponse(await councilBrief(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=60" } });
  } catch {
    return new NextResponse("The Council ledger is unreachable right now. Follow your SOUL.md and the last mission you know.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

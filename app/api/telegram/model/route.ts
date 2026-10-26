import { NextRequest, NextResponse } from "next/server";
import { bardModel, bardSay } from "@/lib/bard/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Check which model the bard uses and hear a sample: /api/telegram/model?secret=<TELEGRAM_WEBHOOK_SECRET> */
export async function GET(request: NextRequest) {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || request.nextUrl.searchParams.get("secret") !== process.env.TELEGRAM_WEBHOOK_SECRET)
    return NextResponse.json({ ok: false }, { status: 401 });
  const model = await bardModel();
  const sample = await bardSay(request.nextUrl.searchParams.get("q") ?? "Who are you, and what is this tavern?", "Huri");
  return NextResponse.json({ model, sample });
}

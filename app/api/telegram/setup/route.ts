import { NextRequest, NextResponse } from "next/server";
import { telegram } from "@/lib/bard/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One-time: open /api/telegram/setup?secret=<TELEGRAM_WEBHOOK_SECRET> to connect the bot to this site. */
export async function GET(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !process.env.TELEGRAM_BOT_TOKEN || request.nextUrl.searchParams.get("secret") !== secret)
    return NextResponse.json({ ok: false, error: "Not configured or wrong secret." }, { status: 401 });
  const url = `${request.nextUrl.origin}/api/telegram`;
  const hook = await telegram("setWebhook", { url, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
  await telegram("setMyCommands", { commands: [
    { command: "tale", description: "The legend of the guild" },
    { command: "bounties", description: "Jobs on the tavern wall" },
    { command: "loot", description: "Where the gold goes" },
    { command: "bard", description: "Ask the bard anything" },
  ] });
  const me = await telegram("getMe", {});
  return NextResponse.json({ webhook: hook.ok ? "connected" : hook.description, bot: me?.result?.username, botId: me?.result?.id, url });
}

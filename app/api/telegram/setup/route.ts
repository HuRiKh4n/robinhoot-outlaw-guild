import { NextRequest, NextResponse } from "next/server";
import { telegram } from "@/lib/bard/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Connect the bot to this site: /api/telegram/setup?secret=<TELEGRAM_WEBHOOK_SECRET>, or ?restore=1.
 *  restore needs no secret: it can only point the bot back at this site's own webhook, which is harmless. */
export async function GET(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const restore = request.nextUrl.searchParams.get("restore") === "1";
  if (!secret || !process.env.TELEGRAM_BOT_TOKEN || (!restore && request.nextUrl.searchParams.get("secret") !== secret))
    return NextResponse.json({ ok: false, error: "Not configured or wrong secret." }, { status: 401 });
  const url = "https://www.robinhoot.fun/api/telegram";
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

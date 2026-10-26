import { NextRequest, NextResponse } from "next/server";
import { bardSay } from "@/lib/bard/ai";
import { SITE } from "@/lib/bard/persona";
import { reply } from "@/lib/bard/telegram";
import { bounties } from "@/lib/bounties/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Best-effort flood control per instance: one AI answer per person every 20 s.
const lastAnswer = new Map<number, number>();

interface TgUser { id: number; first_name?: string; is_bot?: boolean; username?: string }
interface TgMessage {
  message_id: number; chat: { id: number; type: string }; from?: TgUser; text?: string;
  new_chat_members?: TgUser[]; reply_to_message?: { from?: TgUser };
}

export async function POST(request: NextRequest) {
  // Only Telegram knows the secret set at webhook registration.
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || request.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET)
    return NextResponse.json({ ok: false }, { status: 401 });
  const update = await request.json().catch(() => null);
  const message: TgMessage | undefined = update?.message;
  if (!message) return NextResponse.json({ ok: true });
  const chat = message.chat.id;
  const botName = (process.env.TELEGRAM_BOT_USERNAME ?? "").replace(/^@/, "").toLowerCase();

  try {
    // Newcomers: one welcome for the whole group of arrivals.
    const humans = (message.new_chat_members ?? []).filter(member => !member.is_bot);
    if (humans.length) {
      const names = humans.map(member => member.first_name ?? "stranger").join(", ");
      const text = await bardSay(`Welcome these newcomers to the tavern and invite them to forge their outlaw at ${SITE}/my-outlaw: ${names}`);
      await reply(chat, text);
      return NextResponse.json({ ok: true });
    }

    const text = (message.text ?? "").trim();
    if (!text || message.from?.is_bot) return NextResponse.json({ ok: true });
    const [rawCommand, ...rest] = text.split(/\s+/);
    const command = rawCommand.startsWith("/") ? rawCommand.slice(1).split("@")[0].toLowerCase() : "";
    const args = rest.join(" ");

    switch (command) {
      case "start": case "help":
        await reply(chat, `🎻 I'm Tobias, the bard of the RobinHoot hideout.\n\n/tale – the legend of the guild\n/bounties – jobs on the tavern wall\n/loot – where the gold goes\n/bard <anything> – ask me something\n\nOr just mention me or reply to my songs.\n\n${SITE}`, message.message_id);
        return NextResponse.json({ ok: true });
      case "bounties":
        await reply(chat, `📜 Pinned to the tavern wall tonight:\n\n${bounties.slice(0, 6).map(b => `• ${b.title}`).join("\n")}\n\nRead the contracts: ${SITE}/bounties`, message.message_id);
        return NextResponse.json({ ok: true });
      case "loot":
        await reply(chat, `💰 The Sheriff's tax is 2% in NEAR on every trade: 80% to the Guild Chest for outlaws who do the work, 20% to keep the hideout lit. Every wallet is public.\n\n${SITE}/loot`, message.message_id);
        return NextResponse.json({ ok: true });
      case "tale":
        await reply(chat, await bardSay("Tell the legend of how the Outlaw Guild was born, as a short tavern song."), message.message_id);
        return NextResponse.json({ ok: true });
    }

    const mentioned = botName && text.toLowerCase().includes(`@${botName}`);
    const repliedToBard = Boolean(botName) && message.reply_to_message?.from?.username?.toLowerCase() === botName;
    const privateChat = message.chat.type === "private";
    if (command === "bard" || mentioned || repliedToBard || privateChat) {
      const from = message.from?.id ?? 0;
      const now = Date.now();
      if (now - (lastAnswer.get(from) ?? 0) < 20000) return NextResponse.json({ ok: true });
      lastAnswer.set(from, now);
      const question = (command === "bard" ? args : text.replace(new RegExp(`@${botName}`, "ig"), "")).trim() || "Sing me something about the guild.";
      await reply(chat, await bardSay(question, message.from?.first_name), message.message_id);
    }
  } catch {
    // Never make Telegram retry forever.
  }
  return NextResponse.json({ ok: true });
}

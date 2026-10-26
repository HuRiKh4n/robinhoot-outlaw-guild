import "server-only";

const api = (method: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

export async function telegram(method: string, body: Record<string, unknown>) {
  const response = await fetch(api(method), {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000), cache: "no-store",
  });
  return response.json().catch(() => ({ ok: false }));
}

export function reply(chatId: number, text: string, replyTo?: number) {
  return telegram("sendMessage", {
    chat_id: chatId, text, link_preview_options: { is_disabled: true },
    ...(replyTo ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } } : {}),
  });
}

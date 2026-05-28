import { NextResponse } from "next/server";
import { handleUpdate } from "@/app/lib/relay";
import type { TgUpdate } from "@/app/lib/telegram";

export async function POST(req: Request) {
  // Защита: Telegram должен слать через секретный путь или с header X-Telegram-Bot-Api-Secret-Token
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const incoming = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret && incoming !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_CHAT_ID ?? null;

  if (!token) {
    console.error("[telegram-webhook] TELEGRAM_BOT_TOKEN не задан");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  try {
    await handleUpdate(update, { token, adminChatId });
  } catch (err) {
    console.error("[telegram-webhook] handler error:", err);
  }

  // Telegram ждёт 200 в любом случае, чтобы не ретраить
  return NextResponse.json({ ok: true });
}

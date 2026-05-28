import { NextResponse } from "next/server";
import { notifyFormSubmission } from "@/app/lib/relay";

type Body = {
  firstName?: string;
  lastName?: string;
  contactMethod?: string;
  contact?: string;
  message?: string;
  honeypot?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // Honeypot: ботам обычно лень читать DOM, они заполняют все поля
  if (body.honeypot) {
    return NextResponse.json({ ok: true });
  }

  const firstName = (body.firstName ?? "").trim().slice(0, 80);
  const lastName = (body.lastName ?? "").trim().slice(0, 80);
  const contactMethod = (body.contactMethod ?? "").trim().slice(0, 30);
  const contact = (body.contact ?? "").trim().slice(0, 200);
  const message = (body.message ?? "").trim().slice(0, 4000);

  if (!firstName || !lastName || !contact || !message) {
    return NextResponse.json(
      { error: "Заполни имя, фамилию, контакт и сообщение." },
      { status: 400 },
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_CHAT_ID ?? null;

  if (!token || !adminChatId) {
    console.error(
      "[contact] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы в .env.local",
    );
    return NextResponse.json(
      {
        error: "Форма пока не настроена. Свяжись через Telegram-бота напрямую.",
      },
      { status: 503 },
    );
  }

  try {
    await notifyFormSubmission(
      { token, adminChatId },
      { firstName, lastName, contactMethod, contact, message },
    );
  } catch (err) {
    console.error("[contact] notify failed:", err);
    return NextResponse.json(
      { error: "Не удалось отправить. Попробуй ещё раз позже." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

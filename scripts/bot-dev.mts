/**
 * Локальный polling-режим для разработки и тестирования бота.
 * Запуск: `npm run bot`
 *
 * Polling несовместим с webhook — скрипт сначала удаляет webhook,
 * потом тянет updates по long polling и для каждого вызывает handleUpdate.
 * Для прода (Vercel) — НЕ нужен, там работает webhook.
 */
import "dotenv/config";
import { config as dotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { handleUpdate } from "../app/lib/relay";
import type { TgUpdate } from "../app/lib/telegram";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..");
dotenv({ path: join(projectRoot, ".env.local") });

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.TELEGRAM_CHAT_ID ?? null;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN не задан в .env.local");
  process.exit(1);
}

// Проверяем, что admin_chat_id != собственный ID бота (распространённая ошибка)
let effectiveAdminId: string | null = adminChatId;
{
  const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const j = (await r.json()) as {
    ok: boolean;
    result?: { id: number; username?: string };
  };
  if (j.ok && j.result) {
    if (adminChatId && String(j.result.id) === adminChatId) {
      console.warn(
        `⚠️  TELEGRAM_CHAT_ID (${adminChatId}) совпадает с ID самого бота — бот не может писать сам себе.`,
      );
      console.warn(
        `   Режим онбординга: первое сообщение от тебя получит ответ с твоим настоящим ID.`,
      );
      effectiveAdminId = null;
    } else {
      console.log(`   Бот: @${j.result.username ?? "?"} (id=${j.result.id})`);
    }
  }
}

console.log("🤖 gallogramer bot — polling mode");
console.log(
  `   Admin chat_id: ${
    effectiveAdminId ?? "(онбординг — пришли /start чтобы узнать свой ID)"
  }`,
);

// Удаляем webhook если был установлен — polling и webhook несовместимы
{
  const r = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
    method: "POST",
  });
  if (r.ok) console.log("   Webhook сброшен.");
}

let offset = 0;
const env = { token, adminChatId: effectiveAdminId };

console.log("   Жду сообщений… (Ctrl+C для остановки)\n");

while (true) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?timeout=30&offset=${offset}`,
    );
    const json = (await res.json()) as {
      ok: boolean;
      result?: TgUpdate[];
    };
    if (!json.ok) {
      console.error("Telegram error:", json);
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    for (const update of json.result ?? []) {
      offset = update.update_id + 1;
      const fromId = update.message?.from?.id;
      const sender =
        update.message?.from?.username ??
        update.message?.from?.first_name ??
        "?";
      const text = (update.message?.text ?? "").slice(0, 60);
      console.log(`← from ${sender} [id=${fromId}]: ${text}`);
      try {
        await handleUpdate(update, env);
      } catch (err) {
        console.error("handleUpdate error:", err);
      }
    }
  } catch (err) {
    console.error("Poll loop error:", err);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

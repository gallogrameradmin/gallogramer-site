/**
 * Реле-бот: клиент ↔ бот ↔ админ (Слава).
 *
 * Также админ может:
 *  - /upload + кидать фото/видео → бот сохраняет, /done обновляет манифесты
 *  - /list — посмотреть последние медиа
 *  - /del N | /del last | /del <имя> — удалить
 */

import {
  type TgUpdate,
  type TgMessage,
  sendMessage,
  escapeHtml,
} from "./telegram";
import {
  hasGreeted,
  markGreeted,
  isUploadMode,
  setUploadMode,
  setLastListedItems,
  getLastListedItems,
} from "./storage";
import { downloadAndSavePhoto } from "./photo-upload";
import { downloadAndSaveVideo } from "./video-upload";
import { regenerateAllManifests } from "./manifest";
import {
  deleteMedia,
  findMediaByHint,
  listAllMedia,
  shortAgo,
} from "./photos-fs";

const CLIENT_ID_RE = /CLIENT_ID:(-?\d+)/;

export type RelayEnv = {
  token: string;
  adminChatId: string | null;
};

export async function handleUpdate(update: TgUpdate, env: RelayEnv) {
  const msg = update.message;
  if (!msg || !msg.from) return;

  const senderId = msg.from.id;

  if (!env.adminChatId) {
    await sendMessage(env.token, {
      chat_id: senderId,
      text:
        `<b>Бот живой. Это твой чат с ботом.</b>\n\n` +
        `Твой <code>chat_id</code>: <code>${senderId}</code>\n\n` +
        `Добавь его в <code>.env.local</code>:\n` +
        `<pre>TELEGRAM_CHAT_ID=${senderId}</pre>` +
        `\nПерезапусти бота — и все заявки клиентов будут падать сюда.`,
      parse_mode: "HTML",
    });
    return;
  }

  const isAdmin = String(senderId) === env.adminChatId;
  if (isAdmin) return handleAdminMessage(msg, env);
  return handleClientMessage(msg, env);
}

async function handleClientMessage(msg: TgMessage, env: RelayEnv) {
  if (!msg.from || !msg.text) return;
  const from = msg.from;
  const senderName =
    `${from.first_name ?? ""}${from.last_name ? " " + from.last_name : ""}`.trim() ||
    "Аноним";
  const usernamePart = from.username ? ` @${from.username}` : "";

  const header =
    `📥 <b>Новое сообщение клиенту</b>\n` +
    `<b>От:</b> ${escapeHtml(senderName)}${escapeHtml(usernamePart)}\n` +
    `<i>CLIENT_ID:${from.id}</i>\n\n`;

  await sendMessage(env.token, {
    chat_id: env.adminChatId!,
    text: header + escapeHtml(msg.text),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  if (!(await hasGreeted(from.id))) {
    await sendMessage(env.token, {
      chat_id: from.id,
      text: "Здравствуйте! Ваша заявка уже отправлена, скоро мы с вами свяжемся.",
    });
    await markGreeted(from.id);
  }
}

async function handleAdminMessage(msg: TgMessage, env: RelayEnv) {
  if (msg.text?.startsWith("/")) return handleAdminCommand(msg, env);
  if (msg.photo && msg.photo.length > 0) return handleAdminPhoto(msg, env);
  if (msg.video) return handleAdminVideo(msg, env);
  if (msg.text) return handleAdminReply(msg, env);
}

async function handleAdminReply(msg: TgMessage, env: RelayEnv) {
  if (!msg.text) return;
  const replyTo = msg.reply_to_message;
  if (!replyTo?.text) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text:
        "ℹ️ Чтобы ответить клиенту — сделай <b>Reply</b> на его сообщении.\n\n" +
        "Команды:\n" +
        "/upload — приём фото/видео в портфолио\n" +
        "/done — закончить и обновить сайт\n" +
        "/list — последние медиа · /del N — удалить\n" +
        "/help — подробнее",
      parse_mode: "HTML",
    });
    return;
  }
  const match = replyTo.text.match(CLIENT_ID_RE);
  if (!match) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: "⚠️ В сообщении, на которое ты ответил, нет CLIENT_ID.",
    });
    return;
  }
  const clientId = match[1];
  try {
    await sendMessage(env.token, { chat_id: clientId, text: msg.text });
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: `✓ Отправлено клиенту`,
      reply_to_message_id: msg.message_id,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: `❌ Не удалось отправить клиенту:\n<code>${escapeHtml(m)}</code>`,
      parse_mode: "HTML",
    });
  }
}

async function handleAdminPhoto(msg: TgMessage, env: RelayEnv) {
  if (!msg.photo || msg.photo.length === 0) return;
  if (!(await isUploadMode())) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text:
        "📷 Чтобы добавить фото — сначала /upload, потом кидай. /done в конце.",
      reply_to_message_id: msg.message_id,
    });
    return;
  }
  try {
    const saved = await downloadAndSavePhoto(env.token, msg.photo, msg.message_id);
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: `📷 ✓ <code>${escapeHtml(saved.src)}</code> (${saved.w}×${saved.h})`,
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: `❌ Не удалось сохранить фото:\n<code>${escapeHtml(m)}</code>`,
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  }
}

async function handleAdminVideo(msg: TgMessage, env: RelayEnv) {
  if (!msg.video) return;
  if (!(await isUploadMode())) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text:
        "🎥 Чтобы добавить видео — сначала /upload, потом кидай. /done в конце.",
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  const sizeMB = msg.video.file_size ? (msg.video.file_size / 1048576).toFixed(1) : "?";
  // Информируем о лимите ДО попытки скачать
  if (msg.video.file_size && msg.video.file_size > 20 * 1024 * 1024) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text:
        `⚠️ Видео ${sizeMB} МБ — больше лимита бота (20 МБ).\n` +
        `Сожми в Telegram («Сжать видео» при отправке) или загрузи в меньшем разрешении.`,
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  try {
    const saved = await downloadAndSaveVideo(env.token, msg.video, msg.message_id);
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text:
        `🎥 ✓ <code>${escapeHtml(saved.src)}</code> ` +
        `(${saved.w}×${saved.h}, ${saved.duration}с${saved.thumb ? ", обложка ✓" : ""})`,
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: `❌ Не удалось сохранить видео:\n<code>${escapeHtml(m)}</code>`,
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  }
}

async function handleAdminCommand(msg: TgMessage, env: RelayEnv) {
  const cmd = msg.text!.trim().split(/\s+/)[0].toLowerCase();
  switch (cmd) {
    case "/start":
    case "/help":
      await sendMessage(env.token, {
        chat_id: env.adminChatId!,
        text:
          "<b>Реле-бот @gallogramer_bot</b>\n\n" +
          "Клиенты пишут боту — их сообщения приходят сюда с заголовком.\n" +
          "Чтобы ответить — <b>Reply</b> на сообщение клиента.\n\n" +
          "<b>Добавление медиа:</b>\n" +
          "/upload — приём фото и видео\n" +
          "/done — закончить, обновить сайт\n" +
          "/cancel — отменить без обновления\n\n" +
          "<b>Удаление:</b>\n" +
          "/list [N] — последние N медиа (по умолчанию 20)\n" +
          "/del N — по номеру из /list\n" +
          "/del &lt;имя&gt; — по имени файла / подстроке\n" +
          "/del last — самое свежее\n\n" +
          "<b>Лимиты Telegram:</b> бот может скачивать файлы до 20 МБ. " +
          "Для больших видео — сжимай при отправке.\n\n" +
          "/id — твой chat_id",
        parse_mode: "HTML",
      });
      return;

    case "/id":
      await sendMessage(env.token, {
        chat_id: env.adminChatId!,
        text: `Твой chat_id: <code>${msg.from!.id}</code>`,
        parse_mode: "HTML",
      });
      return;

    case "/upload":
      await setUploadMode(true);
      await sendMessage(env.token, {
        chat_id: env.adminChatId!,
        text:
          "📷🎥 <b>Режим приёма включён.</b>\n\n" +
          "Кидай фотографии и видео — буду сохранять в портфолио.\n" +
          "Можно по одной, можно альбомом.\n" +
          "Видео — до 20 МБ (лимит Telegram bot API).\n\n" +
          "Закончил — /done.\n" +
          "Передумал — /cancel.",
        parse_mode: "HTML",
      });
      return;

    case "/done":
      if (!(await isUploadMode())) {
        await sendMessage(env.token, {
          chat_id: env.adminChatId!,
          text: "Сначала включи режим: /upload",
        });
        return;
      }
      await setUploadMode(false);
      try {
        const r = regenerateAllManifests();
        await sendMessage(env.token, {
          chat_id: env.adminChatId!,
          text:
            `✅ Готово. Манифесты обновлены.\n` +
            `📷 Фото в портфолио: <b>${r.photos.count}</b>\n` +
            `🎥 Видео в портфолио: <b>${r.videos.count}</b>`,
          parse_mode: "HTML",
        });
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        await sendMessage(env.token, {
          chat_id: env.adminChatId!,
          text: `❌ Не удалось обновить манифесты:\n<code>${escapeHtml(m)}</code>`,
          parse_mode: "HTML",
        });
      }
      return;

    case "/cancel":
      await setUploadMode(false);
      await sendMessage(env.token, {
        chat_id: env.adminChatId!,
        text: "Режим upload отменён. Манифест не менялся.",
      });
      return;

    case "/list":
      await handleList(msg, env);
      return;

    case "/del":
    case "/delete":
      await handleDelete(msg, env);
      return;

    default:
      await sendMessage(env.token, {
        chat_id: env.adminChatId!,
        text: `Команда <code>${escapeHtml(cmd)}</code> не известна. /help`,
        parse_mode: "HTML",
      });
  }
}

async function handleList(msg: TgMessage, env: RelayEnv) {
  const args = msg.text!.trim().split(/\s+/).slice(1);
  const requested = parseInt(args[0] ?? "20", 10);
  const N = Math.min(50, Math.max(1, isNaN(requested) ? 20 : requested));

  const all = listAllMedia();
  if (all.length === 0) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: "В портфолио пока пусто. /upload и кидай фото или видео.",
    });
    return;
  }

  const slice = all.slice(0, N);
  await setLastListedItems(
    slice.map((m) => ({ kind: m.kind, filename: m.filename })),
  );

  const photoCount = all.filter((m) => m.kind === "photo").length;
  const videoCount = all.filter((m) => m.kind === "video").length;

  const lines = slice.map((m, i) => {
    const name =
      m.filename.length > 28
        ? m.filename.slice(0, 12) + "…" + m.filename.slice(-12)
        : m.filename;
    const icon = m.kind === "photo" ? "📷" : "🎥";
    return `<code>${String(i + 1).padStart(2, " ")}</code> ${icon} ${escapeHtml(name)}  <i>· ${escapeHtml(shortAgo(m.mtimeMs))}</i>`;
  });

  const text =
    `<b>Последние ${slice.length}</b> из ${all.length} (📷 ${photoCount} · 🎥 ${videoCount}):\n\n` +
    lines.join("\n") +
    `\n\nУдалить: <code>/del N</code> · <code>/del &lt;имя&gt;</code> · <code>/del last</code>`;

  await sendMessage(env.token, {
    chat_id: env.adminChatId!,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

async function handleDelete(msg: TgMessage, env: RelayEnv) {
  const args = msg.text!.trim().split(/\s+/).slice(1);
  if (args.length === 0) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: "Что удалить? <code>/del N</code>, <code>/del &lt;имя&gt;</code> или <code>/del last</code>",
      parse_mode: "HTML",
    });
    return;
  }

  let item: { kind: "photo" | "video"; filename: string } | null = null;
  const arg = args[0];

  if (arg === "last") {
    const all = listAllMedia();
    const first = all[0];
    if (first) item = { kind: first.kind, filename: first.filename };
  } else if (/^\d+$/.test(arg)) {
    const idx = parseInt(arg, 10) - 1;
    const last = await getLastListedItems();
    if (last.length === 0) {
      await sendMessage(env.token, {
        chat_id: env.adminChatId!,
        text: "Сначала покажи список: /list",
      });
      return;
    }
    if (idx < 0 || idx >= last.length) {
      await sendMessage(env.token, {
        chat_id: env.adminChatId!,
        text: `Номер ${arg} вне диапазона (доступно ${last.length}).`,
      });
      return;
    }
    item = last[idx];
  } else {
    const found = findMediaByHint(arg);
    if (found) item = { kind: found.kind, filename: found.filename };
  }

  if (!item) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: `Не нашёл файл по «${escapeHtml(arg)}». /list — увидеть список.`,
      parse_mode: "HTML",
    });
    return;
  }

  const ok = deleteMedia(item.kind, item.filename);
  if (!ok) {
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: `Не удалось удалить <code>${escapeHtml(item.filename)}</code>.`,
      parse_mode: "HTML",
    });
    return;
  }

  try {
    const r = regenerateAllManifests();
    const icon = item.kind === "photo" ? "📷" : "🎥";
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text:
        `🗑️ Удалено ${icon}: <code>${escapeHtml(item.filename)}</code>\n` +
        `Осталось: 📷 ${r.photos.count} · 🎥 ${r.videos.count}`,
      parse_mode: "HTML",
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    await sendMessage(env.token, {
      chat_id: env.adminChatId!,
      text: `Файл удалён, но манифест не обновился: <code>${escapeHtml(m)}</code>`,
      parse_mode: "HTML",
    });
  }
}

/**
 * Уведомление админу о заявке с формы сайта.
 */
export async function notifyFormSubmission(
  env: RelayEnv,
  data: {
    firstName: string;
    lastName?: string;
    contactMethod?: string;
    contact: string;
    message: string;
  },
) {
  if (!env.adminChatId) {
    throw new Error("TELEGRAM_CHAT_ID не задан");
  }
  const fullName =
    `${data.firstName}${data.lastName ? " " + data.lastName : ""}`.trim();
  const methodLabel = data.contactMethod
    ? methodPretty(data.contactMethod)
    : "—";

  const text =
    `📩 <b>Заявка с сайта</b>\n\n` +
    `<b>👤 Имя:</b> ${escapeHtml(fullName)}\n` +
    `<b>💬 Способ связи:</b> ${escapeHtml(methodLabel)}\n` +
    `<b>📨 Контакт:</b> ${escapeHtml(data.contact)}\n\n` +
    `<i>Что хочет клиент:</i>\n${escapeHtml(data.message)}`;
  await sendMessage(env.token, {
    chat_id: env.adminChatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

function methodPretty(m: string) {
  switch (m.toLowerCase()) {
    case "telegram":
      return "Telegram";
    case "email":
      return "Email";
    case "phone":
      return "Телефон";
    case "whatsapp":
      return "WhatsApp";
    default:
      return m;
  }
}

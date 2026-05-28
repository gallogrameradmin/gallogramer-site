/**
 * Лёгкая обёртка вокруг Telegram Bot API.
 * Используется и из webhook-роута, и из локального polling-скрипта.
 */

const TG_BASE = "https://api.telegram.org";

export type TgUser = {
  id: number;
  is_bot: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TgPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

export type TgVideo = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  mime_type?: string;
  thumbnail?: TgPhotoSize;
  file_size?: number;
};

export type TgDocument = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  thumbnail?: TgPhotoSize;
  file_size?: number;
};

export type TgMessage = {
  message_id: number;
  from?: TgUser;
  chat: { id: number; type: string };
  date: number;
  text?: string;
  caption?: string;
  photo?: TgPhotoSize[];
  video?: TgVideo;
  document?: TgDocument;
  reply_to_message?: TgMessage;
};

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
};

export type SendMessageOptions = {
  chat_id: number | string;
  text: string;
  parse_mode?: "HTML" | "MarkdownV2";
  reply_to_message_id?: number;
  disable_web_page_preview?: boolean;
};

export async function tgCall<T = unknown>(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${TG_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) {
    throw new Error(`Telegram ${method} failed: ${json.description ?? res.status}`);
  }
  return json.result as T;
}

export function sendMessage(token: string, opts: SendMessageOptions) {
  return tgCall<TgMessage>(token, "sendMessage", opts);
}

/** Получить file_path для скачивания файла из Telegram */
export async function getFilePath(token: string, fileId: string): Promise<string> {
  const r = await tgCall<{ file_path: string }>(token, "getFile", {
    file_id: fileId,
  });
  return r.file_path;
}

/** Полный URL для скачивания файла */
export function fileDownloadUrl(token: string, filePath: string) {
  return `https://api.telegram.org/file/bot${token}/${filePath}`;
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Сохранение видео, полученного от Telegram-бота.
 * Telegram-бот лимит на скачивание = 20 МБ. Если файл больше — getFile вернёт ошибку.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  fileDownloadUrl,
  getFilePath,
  type TgPhotoSize,
  type TgVideo,
} from "./telegram";

export type SavedVideo = {
  src: string;
  thumb: string | null;
  w: number;
  h: number;
  duration: number;
};

const VIDEOS_DIR = () => join(process.cwd(), "public", "videos");
const THUMBS_DIR = () => join(process.cwd(), "public", "videos", "thumbs");

function ensureDirs() {
  if (!existsSync(VIDEOS_DIR()))
    mkdirSync(VIDEOS_DIR(), { recursive: true });
  if (!existsSync(THUMBS_DIR()))
    mkdirSync(THUMBS_DIR(), { recursive: true });
}

export async function downloadAndSaveVideo(
  token: string,
  video: TgVideo,
  messageId: number,
): Promise<SavedVideo> {
  ensureDirs();

  // 1. Скачиваем сам видеофайл
  const filePath = await getFilePath(token, video.file_id);
  const url = fileDownloadUrl(token, filePath);
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(
      `Не удалось скачать видео: HTTP ${res.status}. ` +
        `(Лимит бота — 20 МБ. Сожми видео или отправь меньшего разрешения.)`,
    );
  const buf = Buffer.from(await res.arrayBuffer());

  // Сохраняем — пытаемся определить расширение
  const ext = (filePath.split(".").pop() ?? "mp4").toLowerCase();
  const safeExt = ["mp4", "mov", "webm", "m4v"].includes(ext) ? ext : "mp4";
  const ts = Date.now();
  const filename = `tg-${ts}-${messageId}.${safeExt}`;
  writeFileSync(join(VIDEOS_DIR(), filename), buf);

  // 2. Пытаемся скачать превью (если Telegram прислал)
  let thumbName: string | null = null;
  if (video.thumbnail) {
    try {
      thumbName = await downloadThumb(token, video.thumbnail, ts, messageId);
    } catch (err) {
      console.warn("[video-upload] thumb fail:", err);
    }
  }

  return {
    src: `/videos/${filename}`,
    thumb: thumbName ? `/videos/thumbs/${thumbName}` : null,
    w: video.width || 1280,
    h: video.height || 720,
    duration: video.duration || 0,
  };
}

async function downloadThumb(
  token: string,
  thumb: TgPhotoSize,
  ts: number,
  messageId: number,
): Promise<string> {
  const path = await getFilePath(token, thumb.file_id);
  const url = fileDownloadUrl(token, path);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`thumb HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const filename = `tg-${ts}-${messageId}.jpg`;
  writeFileSync(join(THUMBS_DIR(), filename), buf);
  return filename;
}

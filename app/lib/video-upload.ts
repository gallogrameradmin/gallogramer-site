/**
 * Сохранение видео от Telegram-бота:
 *  - скачивает оригинал из Telegram CDN (лимит бот-API: 20 МБ)
 *  - заливает в Yandex Object Storage (bucket gallogramer-videos)
 *  - превью сохраняет в подпапку thumbs/
 */
import {
  fileDownloadUrl,
  getFilePath,
  type TgPhotoSize,
  type TgVideo,
} from "./telegram";
import { VIDEOS_BUCKET, publicUrl, putObject } from "./s3";

export type SavedVideo = {
  src: string;
  thumb: string | null;
  w: number;
  h: number;
  duration: number;
  key: string;
};

const ALLOWED_VIDEO_EXT = new Set(["mp4", "mov", "webm", "m4v"]);

function mime(ext: string) {
  switch (ext) {
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    default:
      return "video/mp4";
  }
}

export async function downloadAndSaveVideo(
  token: string,
  video: TgVideo,
  messageId: number,
): Promise<SavedVideo> {
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

  const rawExt = (filePath.split(".").pop() ?? "mp4").toLowerCase();
  const ext = ALLOWED_VIDEO_EXT.has(rawExt) ? rawExt : "mp4";
  const ts = Date.now();
  const key = `tg-${ts}-${messageId}.${ext}`;
  await putObject(VIDEOS_BUCKET, key, buf, mime(ext));

  // 2. Превью если есть
  let thumbKey: string | null = null;
  if (video.thumbnail) {
    try {
      thumbKey = await uploadThumb(token, video.thumbnail, ts, messageId);
    } catch (err) {
      console.warn("[video-upload] thumb fail:", err);
    }
  }

  return {
    src: publicUrl(VIDEOS_BUCKET, key),
    thumb: thumbKey ? publicUrl(VIDEOS_BUCKET, thumbKey) : null,
    w: video.width || 1280,
    h: video.height || 720,
    duration: video.duration || 0,
    key,
  };
}

async function uploadThumb(
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
  const key = `thumbs/tg-${ts}-${messageId}.jpg`;
  await putObject(VIDEOS_BUCKET, key, buf, "image/jpeg");
  return key;
}

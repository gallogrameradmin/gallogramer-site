/**
 * Утилиты бота для list/del операций над медиа в Yandex Object Storage.
 * Раньше работали с public/photos/ + public/videos/, теперь — с бакетами.
 */
import {
  PHOTOS_BUCKET,
  VIDEOS_BUCKET,
  listObjects,
  deleteObject,
} from "./s3";

export type MediaKind = "photo" | "video";

export type MediaEntry = {
  kind: MediaKind;
  filename: string; // S3 key
  mtimeMs: number; // lastModified.getTime()
};

const PHOTO_EXT_RE = /\.(jpe?g|png|webp|avif)$/i;
const VIDEO_EXT_RE = /\.(mp4|mov|webm|m4v)$/i;

function isRealMediaKey(key: string) {
  // Игнорируем служебные пути (_state/, thumbs/) и manifest.json
  if (key.startsWith("_")) return false;
  if (key.startsWith("thumbs/")) return false;
  if (key === "manifest.json") return false;
  return true;
}

export async function listPhotos(): Promise<MediaEntry[]> {
  const all = await listObjects(PHOTOS_BUCKET);
  return all
    .filter((o) => isRealMediaKey(o.key) && PHOTO_EXT_RE.test(o.key))
    .map((o) => ({
      kind: "photo" as const,
      filename: o.key,
      mtimeMs: o.lastModified?.getTime() ?? 0,
    }));
}

export async function listVideos(): Promise<MediaEntry[]> {
  const all = await listObjects(VIDEOS_BUCKET);
  return all
    .filter((o) => isRealMediaKey(o.key) && VIDEO_EXT_RE.test(o.key))
    .map((o) => ({
      kind: "video" as const,
      filename: o.key,
      mtimeMs: o.lastModified?.getTime() ?? 0,
    }));
}

/** Объединённый список фото + видео, отсортирован по mtime DESC. */
export async function listAllMedia(): Promise<MediaEntry[]> {
  const [p, v] = await Promise.all([listPhotos(), listVideos()]);
  return [...p, ...v].sort((a, b) => b.mtimeMs - a.mtimeMs);
}

/** Удалить медиа из бакета. Для видео — заодно тамбнейл, если есть. */
export async function deleteMedia(
  kind: MediaKind,
  filename: string,
): Promise<boolean> {
  const safe = filename.trim();
  if (!safe || safe.startsWith(".") || safe.startsWith("_")) return false;

  const bucket = kind === "photo" ? PHOTOS_BUCKET : VIDEOS_BUCKET;
  try {
    await deleteObject(bucket, safe);
  } catch (err) {
    console.error("[photos-fs] delete failed:", err);
    return false;
  }

  if (kind === "video") {
    const base = safe.replace(/\.[^.]+$/, "");
    const thumbKey = `thumbs/${base}.jpg`;
    try {
      await deleteObject(VIDEOS_BUCKET, thumbKey);
    } catch {
      // ok если превью не было
    }
  }
  return true;
}

export async function findMediaByHint(
  hint: string,
): Promise<MediaEntry | null> {
  const all = await listAllMedia();
  if (!hint) return null;
  const exact = all.find((m) => m.filename === hint);
  if (exact) return exact;
  const lower = hint.toLowerCase();
  const exactNoExt = all.find(
    (m) => m.filename.toLowerCase().replace(/\.[^.]+$/, "") === lower,
  );
  if (exactNoExt) return exactNoExt;
  const matches = all.filter((m) =>
    m.filename.toLowerCase().includes(lower),
  );
  if (matches.length === 1) return matches[0];
  return null;
}

export function shortAgo(ms: number): string {
  const sec = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (sec < 60) return "только что";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.round(h / 24);
  if (d === 1) return "вчера";
  if (d < 7) return `${d} дн назад`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w} нед назад`;
  return new Date(ms).toISOString().slice(0, 10);
}

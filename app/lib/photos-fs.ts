/**
 * Утилиты для работы с медиа-файлами в public/ на стороне бота.
 * Объединённый список фото + видео для команд /list и /del.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";

const photosDir = () => join(process.cwd(), "public", "photos");
const videosDir = () => join(process.cwd(), "public", "videos");
const thumbsDir = () => join(process.cwd(), "public", "videos", "thumbs");

function ensure(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export type MediaKind = "photo" | "video";

export type MediaEntry = {
  kind: MediaKind;
  filename: string;
  mtimeMs: number;
};

export function listPhotos(): MediaEntry[] {
  const dir = photosDir();
  ensure(dir);
  return readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .map((filename) => ({
      kind: "photo" as const,
      filename,
      mtimeMs: statSync(join(dir, filename)).mtimeMs,
    }));
}

export function listVideos(): MediaEntry[] {
  const dir = videosDir();
  ensure(dir);
  return readdirSync(dir)
    .filter((f) => /\.(mp4|mov|webm|m4v)$/i.test(f))
    .map((filename) => ({
      kind: "video" as const,
      filename,
      mtimeMs: statSync(join(dir, filename)).mtimeMs,
    }));
}

/** Объединённый список фото + видео, отсортирован по mtime DESC */
export function listAllMedia(): MediaEntry[] {
  return [...listPhotos(), ...listVideos()].sort(
    (a, b) => b.mtimeMs - a.mtimeMs,
  );
}

/** Удалить медиа-файл. Для видео заодно удаляет тамбнейл если есть. */
export function deleteMedia(kind: MediaKind, filename: string): boolean {
  const safe = filename.replace(/[\\/]/g, "").trim();
  if (!safe || safe.startsWith(".")) return false;

  const dir = kind === "photo" ? photosDir() : videosDir();
  const full = join(dir, safe);
  if (!existsSync(full)) return false;
  unlinkSync(full);

  if (kind === "video") {
    // Тамбнейл лежит в /videos/thumbs/ под тем же базовым именем + .jpg
    const base = safe.replace(/\.[^.]+$/, "");
    const thumbPath = join(thumbsDir(), `${base}.jpg`);
    if (existsSync(thumbPath)) {
      try {
        unlinkSync(thumbPath);
      } catch {}
    }
  }
  return true;
}

export function findMediaByHint(hint: string): MediaEntry | null {
  const all = listAllMedia();
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

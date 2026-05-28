/**
 * Сохранение фото, полученного от Telegram-бота:
 * - скачивает из Telegram CDN
 * - сохраняет в public/photos/
 * - возвращает результат для манифеста
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { imageSize } from "image-size";
import { fileDownloadUrl, getFilePath, type TgPhotoSize } from "./telegram";

export type SavedPhoto = {
  src: string;
  w: number;
  h: number;
};

/**
 * Скачивает самый крупный вариант фото и сохраняет в public/photos/.
 */
export async function downloadAndSavePhoto(
  token: string,
  photoSizes: TgPhotoSize[],
  messageId: number,
): Promise<SavedPhoto> {
  // Берём самый крупный вариант (Telegram сортирует по возрастанию размера)
  const largest = photoSizes[photoSizes.length - 1];
  if (!largest) throw new Error("Нет вариантов фото в сообщении");

  const filePath = await getFilePath(token, largest.file_id);
  const url = fileDownloadUrl(token, filePath);

  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Не удалось скачать фото: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // Определяем расширение по file_path (jpg/png/webp)
  const ext = (filePath.split(".").pop() ?? "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";

  // Имя файла: tg-{timestamp}-{messageId}.{ext}
  const ts = Date.now();
  const filename = `tg-${ts}-${messageId}.${safeExt}`;
  const photosDir = join(process.cwd(), "public", "photos");
  if (!existsSync(photosDir)) mkdirSync(photosDir, { recursive: true });
  const outPath = join(photosDir, filename);
  writeFileSync(outPath, buf);

  // Размеры предпочитаем из Telegram (быстрее, без чтения файла)
  let w = largest.width;
  let h = largest.height;
  if (!w || !h) {
    const dim = imageSize(buf);
    w = dim.width ?? 1280;
    h = dim.height ?? 1280;
  }

  return { src: `/photos/${filename}`, w, h };
}

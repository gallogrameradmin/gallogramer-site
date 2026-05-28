/**
 * Сохранение фото от Telegram-бота:
 *  - скачивает оригинал из Telegram CDN
 *  - заливает в Yandex Object Storage (bucket gallogramer-photos)
 *  - возвращает публичный URL для манифеста
 */
import { imageSize } from "image-size";
import { fileDownloadUrl, getFilePath, type TgPhotoSize } from "./telegram";
import { PHOTOS_BUCKET, publicUrl, putObject } from "./s3";

export type SavedPhoto = {
  src: string;
  w: number;
  h: number;
  key: string;
};

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

function mime(ext: string) {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

export async function downloadAndSavePhoto(
  token: string,
  photoSizes: TgPhotoSize[],
  messageId: number,
): Promise<SavedPhoto> {
  const largest = photoSizes[photoSizes.length - 1];
  if (!largest) throw new Error("Нет вариантов фото в сообщении");

  const filePath = await getFilePath(token, largest.file_id);
  const url = fileDownloadUrl(token, filePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать фото: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const rawExt = (filePath.split(".").pop() ?? "jpg").toLowerCase();
  const ext = ALLOWED_EXT.has(rawExt) ? rawExt : "jpg";

  const ts = Date.now();
  const key = `tg-${ts}-${messageId}.${ext}`;
  await putObject(PHOTOS_BUCKET, key, buf, mime(ext));

  let w = largest.width;
  let h = largest.height;
  if (!w || !h) {
    try {
      const dim = imageSize(buf);
      w = dim.width ?? 1280;
      h = dim.height ?? 1280;
    } catch {
      w = 1280;
      h = 1280;
    }
  }

  return { src: publicUrl(PHOTOS_BUCKET, key), w, h, key };
}

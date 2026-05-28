/**
 * Перегенерация манифестов в Yandex Object Storage:
 *  - gallogramer-photos/manifest.json
 *  - gallogramer-videos/manifest.json
 *
 * Сайт читает их через `app/lib/photos-source.ts` (ISR 60s).
 * Вызывается ботом после /done, /del и т.п.
 */
import {
  PHOTOS_BUCKET,
  VIDEOS_BUCKET,
  PHOTOS_MANIFEST_KEY,
  VIDEOS_MANIFEST_KEY,
  listObjects,
  putObjectJSON,
  publicUrl,
  s3,
} from "./s3";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

const PHOTO_EXT_RE = /\.(jpe?g|png|webp|avif)$/i;
const VIDEO_EXT_RE = /\.(mp4|mov|webm|m4v)$/i;

export async function regenerateAllManifests() {
  const [photos, videos] = await Promise.all([
    regeneratePhotosManifest(),
    regenerateVideosManifest(),
  ]);
  return { photos, videos };
}

/**
 * Читает Custom-метаданные ширины/высоты из объекта.
 * Если не нашли — fallback на разумный default.
 */
async function getDimensions(
  bucket: string,
  key: string,
): Promise<{ w: number; h: number }> {
  try {
    const r = await s3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const md = r.Metadata ?? {};
    const w = md.w ? parseInt(md.w, 10) : NaN;
    const h = md.h ? parseInt(md.h, 10) : NaN;
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return { w, h };
  } catch {}
  return { w: 1280, h: 1280 };
}

export async function regeneratePhotosManifest() {
  // Берём все объекты из бакета (кроме manifest.json и служебных _state/)
  const all = await listObjects(PHOTOS_BUCKET);
  const photoObjs = all.filter(
    (o) =>
      PHOTO_EXT_RE.test(o.key) &&
      !o.key.startsWith("_") &&
      o.key !== "manifest.json",
  );

  // Сортируем по lastModified (новые сначала)
  photoObjs.sort(
    (a, b) =>
      (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0),
  );

  // Подтягиваем размеры через HEAD-запросы (можно параллельно)
  const items = await Promise.all(
    photoObjs.map(async (o) => {
      const { w, h } = await getDimensions(PHOTOS_BUCKET, o.key);
      return {
        src: publicUrl(PHOTOS_BUCKET, o.key),
        w,
        h,
      };
    }),
  );

  const manifest = {
    generated: new Date().toISOString(),
    items,
  };
  await putObjectJSON(PHOTOS_BUCKET, PHOTOS_MANIFEST_KEY, manifest);
  return { count: items.length, url: publicUrl(PHOTOS_BUCKET, PHOTOS_MANIFEST_KEY) };
}

export async function regenerateVideosManifest() {
  const all = await listObjects(VIDEOS_BUCKET);
  const videoObjs = all.filter(
    (o) =>
      VIDEO_EXT_RE.test(o.key) &&
      !o.key.startsWith("_") &&
      o.key !== "manifest.json",
  );

  videoObjs.sort(
    (a, b) =>
      (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0),
  );

  // Превью лежат в thumbs/<base>.jpg
  const thumbKeys = new Set(
    all.filter((o) => o.key.startsWith("thumbs/")).map((o) => o.key),
  );

  const items = videoObjs.map((o) => {
    const base = o.key.replace(/\.[^.]+$/, "");
    const thumbKey = `thumbs/${base}.jpg`;
    const thumb = thumbKeys.has(thumbKey) ? publicUrl(VIDEOS_BUCKET, thumbKey) : null;
    return {
      src: publicUrl(VIDEOS_BUCKET, o.key),
      thumb,
    };
  });

  const manifest = {
    generated: new Date().toISOString(),
    items,
  };
  await putObjectJSON(VIDEOS_BUCKET, VIDEOS_MANIFEST_KEY, manifest);
  return { count: items.length, url: publicUrl(VIDEOS_BUCKET, VIDEOS_MANIFEST_KEY) };
}

// Совместимость со старым именем
export const regenerateManifest = regeneratePhotosManifest;

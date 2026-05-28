/**
 * Источник данных для портфолио — читает manifest.json из Yandex Object Storage.
 * Используется в Server Components (page.tsx) и передаётся в Client Components пропсами.
 *
 * Кэшируется на стороне Next.js на 60 секунд (revalidate). После загрузки нового
 * фото через бот — манифест обновляется в S3, через минуту сайт его подхватит.
 */

const PHOTOS_BUCKET = process.env.YC_PHOTOS_BUCKET ?? "gallogramer-photos";
const VIDEOS_BUCKET = process.env.YC_VIDEOS_BUCKET ?? "gallogramer-videos";
const ENDPOINT = process.env.YC_S3_ENDPOINT ?? "https://storage.yandexcloud.net";

const PHOTOS_MANIFEST_URL = `${ENDPOINT}/${PHOTOS_BUCKET}/manifest.json`;
const VIDEOS_MANIFEST_URL = `${ENDPOINT}/${VIDEOS_BUCKET}/manifest.json`;

export type Photo = { src: string; w: number; h: number; title?: string };
export type Video = { src: string; thumb: string | null; w?: number; h?: number; duration?: number };

type PhotosManifest = { generated: string; items: Photo[] };
type VideosManifest = { generated: string; items: Video[] };

/**
 * Тянет манифест фоток. Возвращает пустой массив если S3 не отвечает —
 * сайт не упадёт, просто покажет «пусто».
 */
export async function getPhotos(): Promise<Photo[]> {
  try {
    const res = await fetch(PHOTOS_MANIFEST_URL, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as PhotosManifest;
    return data.items ?? [];
  } catch (err) {
    console.error("[photos-source] getPhotos failed:", err);
    return [];
  }
}

export async function getVideos(): Promise<Video[]> {
  try {
    const res = await fetch(VIDEOS_MANIFEST_URL, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as VideosManifest;
    return data.items ?? [];
  } catch (err) {
    console.error("[photos-source] getVideos failed:", err);
    return [];
  }
}

import { NextResponse } from "next/server";
import {
  CopyObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { checkAuth } from "@/app/lib/admin-auth";
import {
  PHOTOS_BUCKET,
  VIDEOS_BUCKET,
  publicUrl,
  s3,
} from "@/app/lib/s3";
import { regenerateVideosManifest } from "@/app/lib/manifest";

type Body = {
  videoKey?: string;
  photoKey?: string; // если null/пусто — сбрасываем кастомную обложку
};

/**
 * Назначает фото из бакета photos как обложку видео.
 *
 * Кастомные и canvas-сгенерированные обложки хранятся по одному ключу
 * thumbs/<base>.jpg в бакете видео — манифест отдаёт его как `thumb`.
 * Поэтому при назначении новой обложки мы просто перезаписываем JPEG копией
 * выбранного фото (server-side S3 copy, без скачивания клиентом).
 *
 * Если photoKey пустой — удаляем thumbs/<base>.jpg, при следующей загрузке
 * вернётся canvas-генерация (если она была) или fallback на preload=metadata.
 */
export async function POST(req: Request) {
  const denial = checkAuth(req);
  if (denial) return denial;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const videoKey = (body.videoKey ?? "").trim();
  const photoKey = (body.photoKey ?? "").trim();

  // Базовая валидация ключа видео
  if (
    !videoKey ||
    videoKey.includes("..") ||
    videoKey.startsWith(".") ||
    videoKey.startsWith("_")
  ) {
    return NextResponse.json(
      { error: "Невалидный videoKey" },
      { status: 400 },
    );
  }

  const baseName = videoKey.replace(/\.[^.]+$/, "");
  const thumbKey = `thumbs/${baseName}.jpg`;

  // ─── Сброс: photoKey пустой → удаляем кастомную обложку ───
  if (!photoKey) {
    try {
      await s3().send(
        new DeleteObjectCommand({ Bucket: VIDEOS_BUCKET, Key: thumbKey }),
      );
    } catch {
      /* ok если файла не было */
    }
    await regenerateVideosManifest();
    return NextResponse.json({ ok: true, cleared: true });
  }

  // ─── Назначение: копируем фото из photos bucket в thumbs/<base>.jpg ───
  if (
    photoKey.includes("..") ||
    photoKey.startsWith(".") ||
    photoKey.startsWith("_")
  ) {
    return NextResponse.json(
      { error: "Невалидный photoKey" },
      { status: 400 },
    );
  }

  // Проверим что фото вообще существует — иначе будет молчаливый 404 на сайте
  try {
    await s3().send(
      new HeadObjectCommand({ Bucket: PHOTOS_BUCKET, Key: photoKey }),
    );
  } catch {
    return NextResponse.json(
      { error: "Фото не найдено в бакете" },
      { status: 404 },
    );
  }

  try {
    await s3().send(
      new CopyObjectCommand({
        Bucket: VIDEOS_BUCKET,
        Key: thumbKey,
        // CopySource в формате /sourceBucket/sourceKey, URL-encoded
        CopySource: `/${PHOTOS_BUCKET}/${encodeURIComponent(photoKey)}`,
        // Принудительно ставим image/jpeg — даже если оригинал PNG/WebP,
        // браузеры всё равно умеют рендерить poster по любому image/*. Но
        // metadata мы заменяем чтобы Cache-Control был правильный.
        MetadataDirective: "REPLACE",
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (err) {
    console.error("[set-video-poster] copy failed:", err);
    return NextResponse.json(
      { error: "Не удалось скопировать фото в обложку" },
      { status: 500 },
    );
  }

  await regenerateVideosManifest();

  return NextResponse.json({
    ok: true,
    thumbUrl: publicUrl(VIDEOS_BUCKET, thumbKey),
  });
}

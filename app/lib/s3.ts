/**
 * Общий S3-клиент для Yandex Object Storage.
 * Используется ботом для записи медиа + чтения/обновления манифестов.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const KEY = process.env.YC_S3_KEY ?? "";
const SECRET = process.env.YC_S3_SECRET ?? "";

export const ENDPOINT =
  process.env.YC_S3_ENDPOINT ?? "https://storage.yandexcloud.net";
export const PHOTOS_BUCKET =
  process.env.YC_PHOTOS_BUCKET ?? "gallogramer-photos";
export const VIDEOS_BUCKET =
  process.env.YC_VIDEOS_BUCKET ?? "gallogramer-videos";
export const STATE_BUCKET = PHOTOS_BUCKET; // храним state в photos-бакете
export const STATE_KEY = "_state/bot.json";

export const PHOTOS_MANIFEST_KEY = "manifest.json";
export const VIDEOS_MANIFEST_KEY = "manifest.json";

// Выделенный YC CDN-ресурс для видео и видеообложек (bc8rgs5kpqyvr55zegry).
// Origin: storage.yandexcloud.net с rewrite /<key> → /gallogramer-videos/<key>
// + host_options.host = storage.yandexcloud.net (это поле настраивается
// только через консоль YC, REST API его молча игнорирует).
const VIDEO_CDN = "https://video.gallogramer.com";

/**
 * Публичный URL для медиа.
 *
 * Фото идут через /media/photos/<key> — Next.js rewrite проксирует на S3,
 * Next/Image оптимизирует и кэширует. Range-запросы не нужны.
 *
 * Видео и видеообложки (thumbs/<base>.jpg) идут через выделенный YC CDN —
 * российские эджи кэшируют 24ч (edgeCacheSettings=86400), byte-range
 * полностью работает (в отличие от Vercel rewrite, который чанкует крупные
 * файлы и портит Content-Range).
 */
export function publicUrl(bucket: string, key: string) {
  if (bucket === PHOTOS_BUCKET) {
    return `/media/photos/${encodeURIComponent(key)}`;
  }
  if (bucket === VIDEOS_BUCKET) {
    return `${VIDEO_CDN}/${encodeURIComponent(key)}`;
  }
  return directObjectUrl(bucket, key);
}

export function directObjectUrl(bucket: string, key: string) {
  return `${ENDPOINT}/${bucket}/${encodeURIComponent(key)}`;
}

let _client: S3Client | null = null;
export function s3(): S3Client {
  if (_client) return _client;
  if (!KEY || !SECRET) {
    throw new Error(
      "[s3] YC_S3_KEY / YC_S3_SECRET не заданы в окружении (Vercel env vars)",
    );
  }
  _client = new S3Client({
    region: "ru-central1",
    endpoint: ENDPOINT,
    credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
    forcePathStyle: false,
  });
  return _client;
}

export async function putObject(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  cacheControl?: string,
) {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );
}

export async function getObjectText(
  bucket: string,
  key: string,
): Promise<string | null> {
  try {
    const r = await s3().send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = await r.Body?.transformToString();
    return body ?? null;
  } catch (err: unknown) {
    const e = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
    if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

export async function getObjectJSON<T>(
  bucket: string,
  key: string,
): Promise<T | null> {
  const text = await getObjectText(bucket, key);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function putObjectJSON(
  bucket: string,
  key: string,
  data: unknown,
) {
  await putObject(
    bucket,
    key,
    JSON.stringify(data, null, 2),
    "application/json",
    // Манифест/state менятся часто — не кэшируем долго.
    "public, max-age=30, must-revalidate",
  );
}

export async function deleteObject(bucket: string, key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function listObjects(bucket: string, prefix?: string) {
  const out: { key: string; size: number; lastModified?: Date }[] = [];
  let continuationToken: string | undefined;
  do {
    const r = await s3().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of r.Contents ?? []) {
      if (!obj.Key) continue;
      out.push({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified,
      });
    }
    continuationToken = r.NextContinuationToken;
  } while (continuationToken);
  return out;
}

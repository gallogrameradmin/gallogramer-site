/**
 * Одноразовый скрипт миграции фото/видео из public/ в Yandex Object Storage.
 * Также генерирует manifest.json в каждом бакете с метаданными для сайта.
 *
 * Запуск: `npx tsx scripts/migrate-to-yc.mts`
 * Нужны env: YC_S3_KEY, YC_S3_SECRET
 */
import { config as dotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, basename } from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { imageSize } from "image-size";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..");
dotenv({ path: join(projectRoot, ".env.local") });

const KEY = process.env.YC_S3_KEY;
const SECRET = process.env.YC_S3_SECRET;
if (!KEY || !SECRET) {
  console.error("❌ Нужны YC_S3_KEY и YC_S3_SECRET в .env.local");
  process.exit(1);
}

const PHOTO_BUCKET = "gallogramer-photos";
const VIDEO_BUCKET = "gallogramer-videos";
const ENDPOINT = "https://storage.yandexcloud.net";

const s3 = new S3Client({
  region: "ru-central1",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
  forcePathStyle: false,
});

const PHOTO_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm"]);

function mime(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".png": return "image/png";
    case ".webp": return "image/webp";
    case ".avif": return "image/avif";
    case ".mp4": return "video/mp4";
    case ".mov": return "video/quicktime";
    case ".webm": return "video/webm";
    default: return "application/octet-stream";
  }
}

async function uploadFile(bucket: string, key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
}

async function migratePhotos() {
  const dir = join(projectRoot, "public", "photos");
  const files = readdirSync(dir).filter((f) => PHOTO_EXT.has(extname(f).toLowerCase()));
  files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  console.log(`📷 ${files.length} фоток, заливаю в ${PHOTO_BUCKET}...`);

  type Item = { key: string; w: number; h: number; mtime: number };
  const items: Item[] = [];
  let i = 0;
  for (const file of files) {
    i++;
    const filePath = join(dir, file);
    const buf = readFileSync(filePath);
    let w = 1600, h = 1067;
    try {
      const dim = imageSize(buf);
      if (dim.width && dim.height) { w = dim.width; h = dim.height; }
    } catch {}
    const key = file; // храним то же имя файла
    await uploadFile(PHOTO_BUCKET, key, buf, mime(extname(file)));
    items.push({ key, w, h, mtime: statSync(filePath).mtimeMs });
    if (i % 10 === 0 || i === files.length) console.log(`  ${i}/${files.length}`);
  }

  // Манифест в том же бакете
  const manifest = {
    generated: new Date().toISOString(),
    items: items.map((it) => ({
      src: `${ENDPOINT}/${PHOTO_BUCKET}/${encodeURIComponent(it.key)}`,
      w: it.w,
      h: it.h,
    })),
  };
  await uploadFile(
    PHOTO_BUCKET,
    "manifest.json",
    Buffer.from(JSON.stringify(manifest, null, 2)),
    "application/json",
  );
  console.log(`📷 manifest.json: ${manifest.items.length} элементов`);
}

async function migrateVideos() {
  const dir = join(projectRoot, "public", "videos");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => VIDEO_EXT.has(extname(f).toLowerCase()));
  } catch { console.log("🎥 public/videos/ нет — пропускаю"); }
  console.log(`🎥 ${files.length} видео`);

  for (const file of files) {
    const buf = readFileSync(join(dir, file));
    await uploadFile(VIDEO_BUCKET, file, buf, mime(extname(file)));
  }
  // Пустой манифест если видео нет
  const manifest = {
    generated: new Date().toISOString(),
    items: files.map((f) => ({
      src: `${ENDPOINT}/${VIDEO_BUCKET}/${encodeURIComponent(f)}`,
      thumb: null,
    })),
  };
  await uploadFile(
    VIDEO_BUCKET,
    "manifest.json",
    Buffer.from(JSON.stringify(manifest, null, 2)),
    "application/json",
  );
  console.log(`🎥 manifest.json: ${manifest.items.length} элементов`);
}

await migratePhotos();
await migrateVideos();
console.log("\n✅ Готово.");
console.log(`📷 https://storage.yandexcloud.net/${PHOTO_BUCKET}/manifest.json`);
console.log(`🎥 https://storage.yandexcloud.net/${VIDEO_BUCKET}/manifest.json`);

/**
 * Одноразовый фикс metadata существующих медиа в Object Storage:
 *  - Content-Type восстанавливается по расширению ключа
 *  - Cache-Control ставится в public, max-age=1y, immutable
 *
 * Запуск: `npx tsx scripts/fix-media-metadata.mts`
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Загружаем .env.local ДО импортов
const here = dirname(fileURLToPath(import.meta.url));
try {
  const text = readFileSync(join(here, "..", ".env.local"), "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
} catch (err) {
  console.error("Не смог прочитать .env.local:", err);
  process.exit(1);
}

const { CopyObjectCommand, HeadObjectCommand } = await import(
  "@aws-sdk/client-s3"
);
const { s3, PHOTOS_BUCKET, VIDEOS_BUCKET, listObjects } = await import(
  "../app/lib/s3"
);

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  m4v: "video/x-m4v",
};

function mimeFor(key: string): string | null {
  const ext = key.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  return MIME[ext] ?? null;
}

async function fixBucket(bucket: string) {
  const all = await listObjects(bucket);
  const real = all.filter(
    (o) => !o.key.startsWith("_") && o.key !== "manifest.json",
  );
  console.log(`\n${bucket}: ${real.length} объектов`);

  let fixed = 0;
  for (const obj of real) {
    const expectedCT = mimeFor(obj.key);
    if (!expectedCT) {
      console.log(`  ⊘ ${obj.key} — неизвестное расширение, скип`);
      continue;
    }
    // Что сейчас лежит
    const head = await s3().send(
      new HeadObjectCommand({ Bucket: bucket, Key: obj.key }),
    );
    const curCT = head.ContentType ?? "";
    const curCC = head.CacheControl ?? "";
    const okCT = curCT === expectedCT;
    const okCC = curCC.includes("max-age=31536000");

    if (okCT && okCC) {
      // Уже всё хорошо
      continue;
    }

    // Сохраняем custom-метаданные (w/h) если были
    const userMeta = head.Metadata ?? {};

    await s3().send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: obj.key,
        CopySource: `/${bucket}/${encodeURIComponent(obj.key)}`,
        MetadataDirective: "REPLACE",
        Metadata: userMeta,
        ContentType: expectedCT,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    fixed++;
    console.log(
      `  ✓ ${obj.key}: CT ${curCT || "—"} → ${expectedCT}; CC ${curCC || "—"} → max-age=1y`,
    );
  }
  console.log(`  ИТОГ: пофикшено ${fixed} из ${real.length}`);
}

await fixBucket(PHOTOS_BUCKET);
await fixBucket(VIDEOS_BUCKET);
console.log("\n✅ Готово. Проверь /portfolio — видео должно стримиться.");

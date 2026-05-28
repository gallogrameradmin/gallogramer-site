/**
 * Регенерирует манифесты в Yandex Object Storage с актуальной логикой publicUrl().
 * Запуск: `npx tsx scripts/regen-manifest.mts`
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ─── 1. Загружаем .env.local В process.env ДО импортов ───
const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env.local");
try {
  const text = readFileSync(envPath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!process.env[k]) process.env[k] = v;
  }
  console.log(`✓ loaded ${envPath}`);
} catch (err) {
  console.error("Не смог прочитать .env.local:", err);
  process.exit(1);
}

// ─── 2. Динамический импорт модуля (после env) ───
const { regenerateAllManifests } = await import("../app/lib/manifest");

// ─── 3. Запуск ───
const r = await regenerateAllManifests();
console.log(`📷 Photos: ${r.photos.count} items → ${r.photos.url}`);
console.log(`🎥 Videos: ${r.videos.count} items → ${r.videos.url}`);

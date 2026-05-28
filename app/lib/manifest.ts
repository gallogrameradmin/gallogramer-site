/**
 * Перегенерация манифестов:
 *  - app/data/photos.ts из public/photos/
 *  - app/data/videos.ts из public/videos/ + public/videos/thumbs/
 *
 * Вызывается ботом после /done, /del и т.п.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { imageSize } from "image-size";

const root = () => process.cwd();

export function regenerateAllManifests() {
  return {
    photos: regeneratePhotosManifest(),
    videos: regenerateVideosManifest(),
  };
}

export function regeneratePhotosManifest(): { count: number; path: string } {
  const photosDir = join(root(), "public", "photos");
  const outFile = join(root(), "app", "data", "photos.ts");

  if (!existsSync(photosDir)) mkdirSync(photosDir, { recursive: true });
  if (!existsSync(dirname(outFile)))
    mkdirSync(dirname(outFile), { recursive: true });

  // Сортировка по дате модификации, новые сначала
  const files = readdirSync(photosDir)
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .map((file) => ({
      file,
      mtimeMs: statSync(join(photosDir, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map((x) => x.file);

  const items = files.map((file) => {
    const buf = readFileSync(join(photosDir, file));
    const { width, height } = imageSize(buf);
    return { src: `/photos/${file}`, w: width ?? 1280, h: height ?? 1280 };
  });

  const ts = `// Auto-generated — do not edit by hand.
// ${new Date().toISOString()} · ${items.length} photos
export type Photo = { src: string; w: number; h: number; title?: string };

export const photos: Photo[] = ${JSON.stringify(items, null, 2)};
`;

  writeFileSync(outFile, ts);
  return { count: items.length, path: outFile };
}

export function regenerateVideosManifest(): { count: number; path: string } {
  const videosDir = join(root(), "public", "videos");
  const thumbsDir = join(videosDir, "thumbs");
  const outFile = join(root(), "app", "data", "videos.ts");

  if (!existsSync(videosDir)) mkdirSync(videosDir, { recursive: true });
  if (!existsSync(thumbsDir)) mkdirSync(thumbsDir, { recursive: true });
  if (!existsSync(dirname(outFile)))
    mkdirSync(dirname(outFile), { recursive: true });

  const files = readdirSync(videosDir)
    .filter(
      (f) =>
        statSync(join(videosDir, f)).isFile() &&
        /\.(mp4|mov|webm|m4v)$/i.test(f),
    )
    .sort();

  const items = files.map((file) => {
    const base = file.replace(/\.[^.]+$/, "");
    const thumbName = `${base}.jpg`;
    const thumbFull = join(thumbsDir, thumbName);
    const hasThumb = existsSync(thumbFull);
    return {
      src: `/videos/${file}`,
      thumb: hasThumb ? `/videos/thumbs/${thumbName}` : null,
    };
  });

  const ts = `// Auto-generated — do not edit by hand.
// ${new Date().toISOString()} · ${items.length} videos
export type Video = {
  src: string;
  thumb: string | null;
  w?: number;
  h?: number;
  duration?: number;
  title?: string;
};

export const videos: Video[] = ${JSON.stringify(items, null, 2)};
`;

  writeFileSync(outFile, ts);
  return { count: items.length, path: outFile };
}

// Совместимость со старым именем
export const regenerateManifest = regeneratePhotosManifest;

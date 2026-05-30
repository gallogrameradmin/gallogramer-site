import { NextResponse } from "next/server";
import { checkAuth } from "@/app/lib/admin-auth";
import { listAllMedia, shortAgo } from "@/app/lib/photos-fs";
import {
  PHOTOS_BUCKET,
  VIDEOS_BUCKET,
  listObjects,
  publicUrl,
} from "@/app/lib/s3";

export async function GET(req: Request) {
  const denial = checkAuth(req);
  if (denial) return denial;

  // Соберём все ключи thumbs/* чтобы для каждого видео отдать его текущую
  // обложку — без этого UI не понимает, есть ли уже назначенный poster
  // (canvas-сгенерированный или скопированный из фото).
  const allVideoObjects = await listObjects(VIDEOS_BUCKET);
  const thumbKeys = new Set(
    allVideoObjects
      .filter((o) => o.key.startsWith("thumbs/"))
      .map((o) => o.key),
  );

  const items = await listAllMedia();
  return NextResponse.json({
    items: items.map((m) => {
      const bucket = m.kind === "photo" ? PHOTOS_BUCKET : VIDEOS_BUCKET;
      const base = {
        kind: m.kind,
        key: m.filename,
        url: publicUrl(bucket, m.filename),
        mtimeMs: m.mtimeMs,
        ago: shortAgo(m.mtimeMs),
      } as const;
      if (m.kind !== "video") return base;
      const thumbKey = `thumbs/${m.filename.replace(/\.[^.]+$/, "")}.jpg`;
      const thumbUrl = thumbKeys.has(thumbKey)
        ? publicUrl(VIDEOS_BUCKET, thumbKey)
        : null;
      return { ...base, thumbUrl };
    }),
  });
}

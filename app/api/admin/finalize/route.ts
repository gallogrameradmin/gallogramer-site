import { NextResponse } from "next/server";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { checkAuth } from "@/app/lib/admin-auth";
import { PHOTOS_BUCKET, VIDEOS_BUCKET, s3 } from "@/app/lib/s3";
import { regenerateAllManifests } from "@/app/lib/manifest";

type Body = {
  kind?: "photo" | "video";
  key?: string;
  w?: number;
  h?: number;
};

/**
 * Завершает upload: если браузер прислал w/h — сохраняет их в metadata
 * объекта (через CopyObject in-place), затем регенерит манифесты.
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

  const kind = body.kind;
  const key = (body.key ?? "").trim();
  if (kind !== "photo" && kind !== "video") {
    return NextResponse.json({ error: "kind должен быть photo|video" }, { status: 400 });
  }
  if (!key) {
    return NextResponse.json({ error: "key обязательный" }, { status: 400 });
  }

  const bucket = kind === "photo" ? PHOTOS_BUCKET : VIDEOS_BUCKET;

  // Сохраняем размеры в metadata объекта через CopyObject in-place.
  if (body.w && body.h) {
    try {
      await s3().send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `/${bucket}/${encodeURIComponent(key)}`,
          Key: key,
          MetadataDirective: "REPLACE",
          Metadata: {
            w: String(body.w),
            h: String(body.h),
          },
        }),
      );
    } catch (err) {
      console.warn("[finalize] CopyObject metadata failed:", err);
    }
  }

  const r = await regenerateAllManifests();
  return NextResponse.json({
    ok: true,
    photos: r.photos.count,
    videos: r.videos.count,
  });
}

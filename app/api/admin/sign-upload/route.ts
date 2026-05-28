import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { checkAuth } from "@/app/lib/admin-auth";
import { PHOTOS_BUCKET, VIDEOS_BUCKET, publicUrl, s3 } from "@/app/lib/s3";

const PHOTO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const VIDEO_MIME = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-m4v": "m4v",
};

type Body = {
  kind?: "photo" | "video";
  contentType?: string;
  // оригинальное имя — только для логов, key будет сгенерированный
  originalName?: string;
};

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
  const contentType = (body.contentType ?? "").toLowerCase();
  if (kind !== "photo" && kind !== "video") {
    return NextResponse.json({ error: "kind должен быть photo|video" }, { status: 400 });
  }
  const allowed = kind === "photo" ? PHOTO_MIME : VIDEO_MIME;
  if (!allowed.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported contentType: ${contentType}` },
      { status: 400 },
    );
  }

  const bucket = kind === "photo" ? PHOTOS_BUCKET : VIDEOS_BUCKET;
  const ext = MIME_TO_EXT[contentType] ?? "bin";
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `web-${ts}-${rand}.${ext}`;

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  // URL живёт 1 час — этого хватит на загрузку большого видео
  const url = await getSignedUrl(s3(), cmd, { expiresIn: 3600 });

  return NextResponse.json({
    url,
    key,
    bucket,
    publicUrl: publicUrl(bucket, key),
  });
}

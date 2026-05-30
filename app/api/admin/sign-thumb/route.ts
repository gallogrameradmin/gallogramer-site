import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { checkAuth } from "@/app/lib/admin-auth";
import { VIDEOS_BUCKET, publicUrl, s3 } from "@/app/lib/s3";

type Body = {
  videoKey?: string;
};

/**
 * Возвращает подписанный PUT-URL для JPEG-превью к видео.
 * Браузер генерирует первый кадр через canvas и заливает по этому URL.
 * Ключ всегда thumbs/<base>.jpg в бакете видео.
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
  if (
    !videoKey ||
    videoKey.includes("/") ||
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

  const cmd = new PutObjectCommand({
    Bucket: VIDEOS_BUCKET,
    Key: thumbKey,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  });

  const url = await getSignedUrl(s3(), cmd, { expiresIn: 3600 });
  return NextResponse.json({
    url,
    key: thumbKey,
    publicUrl: publicUrl(VIDEOS_BUCKET, thumbKey),
  });
}

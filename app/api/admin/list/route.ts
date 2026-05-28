import { NextResponse } from "next/server";
import { checkAuth } from "@/app/lib/admin-auth";
import { listAllMedia, shortAgo } from "@/app/lib/photos-fs";
import { PHOTOS_BUCKET, VIDEOS_BUCKET, publicUrl } from "@/app/lib/s3";

export async function GET(req: Request) {
  const denial = checkAuth(req);
  if (denial) return denial;

  const items = await listAllMedia();
  return NextResponse.json({
    items: items.map((m) => ({
      kind: m.kind,
      key: m.filename,
      url: publicUrl(m.kind === "photo" ? PHOTOS_BUCKET : VIDEOS_BUCKET, m.filename),
      mtimeMs: m.mtimeMs,
      ago: shortAgo(m.mtimeMs),
    })),
  });
}

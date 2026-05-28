import { NextResponse } from "next/server";
import { checkAuth } from "@/app/lib/admin-auth";
import { deleteMedia } from "@/app/lib/photos-fs";
import { regenerateAllManifests } from "@/app/lib/manifest";

type Body = {
  kind?: "photo" | "video";
  key?: string;
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
  const key = (body.key ?? "").trim();
  if (kind !== "photo" && kind !== "video") {
    return NextResponse.json({ error: "kind должен быть photo|video" }, { status: 400 });
  }
  if (!key) {
    return NextResponse.json({ error: "key обязательный" }, { status: 400 });
  }

  const ok = await deleteMedia(kind, key);
  if (!ok) {
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }

  const r = await regenerateAllManifests();
  return NextResponse.json({
    ok: true,
    photos: r.photos.count,
    videos: r.videos.count,
  });
}

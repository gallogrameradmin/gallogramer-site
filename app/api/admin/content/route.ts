import { NextResponse } from "next/server";
import { checkAuth } from "@/app/lib/admin-auth";
import {
  getContent,
  putContent,
  type SiteContent,
  type ServiceContent,
} from "@/app/lib/content-source";

export async function GET(req: Request) {
  const denial = checkAuth(req);
  if (denial) return denial;
  const c = await getContent();
  return NextResponse.json(c);
}

export async function POST(req: Request) {
  const denial = checkAuth(req);
  if (denial) return denial;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // Минимальная валидация структуры
  const c = body as Partial<SiteContent>;
  if (!c?.hero || typeof c.hero.bio !== "string") {
    return NextResponse.json({ error: "hero.bio обязателен" }, { status: 400 });
  }
  if (!Array.isArray(c.services) || c.services.length === 0) {
    return NextResponse.json(
      { error: "services должен быть непустым массивом" },
      { status: 400 },
    );
  }

  // Чистим/нормализуем услуги — обрезаем длины, фильтруем пустые
  const services: ServiceContent[] = c.services.map((s) => ({
    title: String(s.title ?? "").slice(0, 60).trim(),
    description: String(s.description ?? "").slice(0, 600).trim(),
    photoSrc: s.photoSrc ? String(s.photoSrc).slice(0, 500) : null,
    caseTitle: String(s.caseTitle ?? "").slice(0, 80).trim(),
  }));

  const normalized: SiteContent = {
    hero: { bio: String(c.hero.bio).slice(0, 2000).trim() },
    services,
  };

  try {
    await putContent(normalized);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/content] putContent failed:", err);
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}

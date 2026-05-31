import { NextResponse } from "next/server";
import { checkAuth } from "@/app/lib/admin-auth";
import {
  getContent,
  putContent,
  type SiteContent,
  type ServiceContent,
  type PricingItem,
  type SocialLink,
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

  // Чистим/нормализуем услуги — обрезаем длины, валидируем media
  const services: ServiceContent[] = c.services.map((s) => {
    let media: ServiceContent["media"] = null;
    if (s.media && typeof s.media === "object") {
      const k = s.media.kind;
      const src = String(s.media.src ?? "").slice(0, 500);
      if ((k === "photo" || k === "video") && src) {
        media = { kind: k, src };
        // poster только для видео
        if (k === "video" && typeof s.media.poster === "string") {
          const poster = s.media.poster.slice(0, 500).trim();
          if (poster) media.poster = poster;
        }
      }
    } else if (s.photoSrc) {
      // Совместимость: если пришёл старый ключ — переносим в media
      media = { kind: "photo", src: String(s.photoSrc).slice(0, 500) };
    }
    return {
      title: String(s.title ?? "").slice(0, 60).trim(),
      description: String(s.description ?? "").slice(0, 600).trim(),
      media,
      caseTitle: String(s.caseTitle ?? "").slice(0, 80).trim(),
    };
  });

  // Прайс — массив тарифов. Пустой массив = блок не показывается на сайте.
  const pricing: PricingItem[] = Array.isArray(c.pricing)
    ? c.pricing
        .map((p) => ({
          title: String(p?.title ?? "").slice(0, 80).trim(),
          description: String(p?.description ?? "").slice(0, 200).trim(),
          price: String(p?.price ?? "").slice(0, 60).trim(),
          unit: String(p?.unit ?? "").slice(0, 40).trim(),
          highlight: Boolean(p?.highlight),
        }))
        // Игнорируем тарифы без заголовка и без цены — это «пустые строки»
        .filter((p) => p.title && p.price)
    : [];

  // Соцсети — пустой массив = блок скрыт. Пускаем только http(s)-ссылки,
  // чтобы случайный javascript:/data:-URL из админки не уехал в DOM.
  const socials: SocialLink[] = Array.isArray(c.socials)
    ? c.socials
        .map((s) => ({
          label: String(s?.label ?? "").slice(0, 40).trim(),
          url: String(s?.url ?? "").slice(0, 500).trim(),
        }))
        .filter(
          (s) =>
            s.label &&
            s.url &&
            /^https?:\/\//i.test(s.url),
        )
    : [];

  const normalized: SiteContent = {
    hero: { bio: String(c.hero.bio).slice(0, 2000).trim() },
    services,
    pricing,
    socials,
  };

  try {
    await putContent(normalized);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/content] putContent failed:", err);
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}

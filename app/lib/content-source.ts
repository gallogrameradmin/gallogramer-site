/**
 * Редактируемый контент сайта (Hero био + Услуги) живёт в S3 как JSON.
 * Сайт читает через ISR (revalidate=60), админка пишет через /api/admin/content.
 */
import { STATE_BUCKET, getObjectJSON, putObjectJSON } from "./s3";

export const CONTENT_KEY = "_content/site.json";

export type ServiceMedia = {
  kind: "photo" | "video";
  src: string;
  /**
   * Постер для видео (URL фото). Используется как HTML5 <video poster="...">,
   * показывается до момента когда видео реально начнёт играть. Если не задан,
   * автоматически берётся canvas-thumbnail сгенерированный при загрузке
   * (thumbs/<base>.jpg в bucket видео). Для kind=photo игнорируется.
   */
  poster?: string;
};

export type ServiceContent = {
  title: string;
  description: string;
  /** Превью карточки — фото или видео. null = автоподбор из портфолио */
  media: ServiceMedia | null;
  /** Подпись под превью, типа «Вечер у друзей» */
  caseTitle: string;
  /** @deprecated — оставлено для миграции старого content.json */
  photoSrc?: string | null;
};

export type SiteContent = {
  hero: {
    bio: string;
  };
  services: ServiceContent[];
};

/**
 * Дефолтное содержание — то что было до появления редактора.
 * Используется когда _content/site.json в S3 ещё не создан.
 */
export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    bio:
      "Начинающий фотограф и видеограф преимущественно в стиле Брутализм. Студент Колледжа Сценарных искусств и дизайна. Снимаю всё — от школьных праздников до закрытых вечеринок и корпоративных ивентов.",
  },
  services: [
    {
      title: "Репортаж",
      description:
        "Концерты, вечеринки, корпоративы. Снимаю, не отвлекая от процесса — отдаю 60-200 кадров за 5-7 дней.",
      media: null,
      caseTitle: "Вечер у друзей",
    },
    {
      title: "Портрет",
      description:
        "Студия или локация. Для соцсетей, личного бренда, портфолио. 1-2 часа съёмки, 20-40 ретушированных кадров.",
      media: null,
      caseTitle: "Личный портрет",
    },
    {
      title: "Видео",
      description:
        "Reels, тизеры, короткие ролики до 60 секунд. Съёмка + монтаж + музыка под ключ.",
      media: null,
      caseTitle: "Реклама бренда",
    },
    {
      title: "Лукбук",
      description:
        "Коммерческая съёмка для брендов одежды, мерча, аксессуаров. Студия или улица, постпродакшен в едином ключе.",
      media: null,
      caseTitle: "Бренд одежды",
    },
    {
      title: "Backstage",
      description:
        "Закулисье съёмок, репетиций, подготовки. Параллельно процессу, не вмешиваюсь в команду.",
      media: null,
      caseTitle: "На съёмочной площадке",
    },
    {
      title: "Интервью",
      description:
        "Съёмка диалогов и подкастов с подготовленным светом. 2-3 камеры, чистый звук, чистовой монтаж.",
      media: null,
      caseTitle: "Подкаст-интервью",
    },
  ],
};

/**
 * Миграция: старый формат имел только photoSrc, новый — media { kind, src }.
 */
function migrateService(s: ServiceContent): ServiceContent {
  if (s.media || !s.photoSrc) return { ...s, photoSrc: undefined };
  return {
    ...s,
    media: { kind: "photo", src: s.photoSrc },
    photoSrc: undefined,
  };
}

export async function getContent(): Promise<SiteContent> {
  try {
    const raw = await getObjectJSON<Partial<SiteContent>>(
      STATE_BUCKET,
      CONTENT_KEY,
    );
    if (!raw) return DEFAULT_CONTENT;
    const services =
      raw.services && raw.services.length > 0
        ? (raw.services as ServiceContent[]).map(migrateService)
        : DEFAULT_CONTENT.services;
    return {
      hero: { ...DEFAULT_CONTENT.hero, ...(raw.hero ?? {}) },
      services,
    };
  } catch (err) {
    console.error("[content-source] getContent failed:", err);
    return DEFAULT_CONTENT;
  }
}

export async function putContent(content: SiteContent): Promise<void> {
  await putObjectJSON(STATE_BUCKET, CONTENT_KEY, content);
}

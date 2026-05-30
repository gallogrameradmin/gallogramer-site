"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ServiceContent,
  ServiceMedia,
  SiteContent,
} from "@/app/lib/content-source";

type MediaItem = {
  kind: "photo" | "video";
  key: string;
  url: string;
};

export default function ContentEditor({
  token,
  apiBase,
}: {
  token: string;
  apiBase: string;
}) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([
        fetch(`${apiBase}/api/admin/content`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${apiBase}/api/admin/list`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ]);
      setContent(c as SiteContent);
      setMedia((l.items ?? []) as MediaItem[]);
    } catch (err) {
      setStatus(`Ошибка загрузки: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateBio = (v: string) => {
    if (!content) return;
    setContent({ ...content, hero: { ...content.hero, bio: v } });
  };

  const updateService = (i: number, patch: Partial<ServiceContent>) => {
    if (!content) return;
    const next = [...content.services];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, services: next });
  };

  const save = async () => {
    if (!content) return;
    setSaving(true);
    setStatus("");
    try {
      const r = await fetch(`${apiBase}/api/admin/content`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setStatus(j.error ?? `Ошибка ${r.status}`);
      } else {
        setStatus(
          "Сохранено ✓ (сайт подхватит изменения в течение минуты)",
        );
        setTimeout(() => setStatus(""), 5000);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-sm text-fg-faint uppercase tracking-[0.18em]">
        Загрузка контента…
      </div>
    );
  }
  if (!content) {
    return (
      <div className="py-24 text-center font-mono text-sm text-red-500">
        Не удалось загрузить контент. {status}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Hero bio */}
      <section className="glass rounded-2xl p-5 md:p-6">
        <h2 className="font-display text-xl md:text-2xl mb-3">
          О тебе на главной<span className="text-accent">.</span>
        </h2>
        <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-faint mb-3">
          Параграф под именем «Slava Bober». Можно вставлять переносы строк.
        </p>
        <textarea
          value={content.hero.bio}
          onChange={(e) => updateBio(e.target.value)}
          rows={5}
          maxLength={2000}
          className="w-full bg-bg-soft text-fg font-sans text-base p-4 rounded-xl border border-line focus:border-accent focus:outline-none transition-colors resize-y"
        />
        <p className="text-[10px] font-mono text-fg-faint mt-1 text-right">
          {content.hero.bio.length} / 2000
        </p>
      </section>

      {/* Услуги */}
      <section>
        <h2 className="font-display text-xl md:text-2xl mb-1">
          Услуги<span className="text-accent">.</span>
        </h2>
        <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-faint mb-5">
          6 карточек на главной. Подпись кейса и превью видны слева, когда
          наводишь на услугу.
        </p>

        <div className="flex flex-col gap-5">
          {content.services.map((s, i) => (
            <ServiceForm
              key={i}
              index={i}
              service={s}
              media={media}
              onChange={(patch) => updateService(i, patch)}
            />
          ))}
        </div>
      </section>

      {/* Кнопка Save */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center gap-3 glass rounded-full px-5 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-full bg-accent text-white font-mono uppercase text-sm tracking-[0.14em] hover:bg-accent/85 disabled:opacity-50 transition-colors"
          >
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
          {status ? (
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-muted flex-1">
              {status}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ServiceForm({
  index,
  service,
  media,
  onChange,
}: {
  index: number;
  service: ServiceContent;
  media: MediaItem[];
  onChange: (patch: Partial<ServiceContent>) => void;
}) {
  // Найти текущее превью в списке
  const selected = service.media
    ? (media.find((m) => m.url === service.media!.src) ?? null)
    : null;

  return (
    <div className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint">
          /00{index + 1}
        </span>
        <input
          type="text"
          value={service.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={60}
          placeholder="Название (Репортаж, Портрет…)"
          className="flex-1 bg-transparent font-display text-2xl md:text-3xl tracking-[-0.02em] text-fg border-b border-line focus:border-accent focus:outline-none pb-1"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-fg-faint mb-2 block">
          Описание услуги
        </label>
        <textarea
          value={service.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          maxLength={600}
          className="w-full bg-bg-soft text-fg text-sm md:text-base p-3 rounded-xl border border-line focus:border-accent focus:outline-none transition-colors resize-y"
        />
        <p className="text-[10px] font-mono text-fg-faint text-right mt-0.5">
          {service.description.length} / 600
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Превью — фото или видео */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-fg-faint mb-2 block">
            Превью (фото или видео из портфолио)
          </label>
          <MediaPicker
            media={media}
            value={service.media}
            onChange={(m) => onChange({ media: m })}
          />
          {selected ? (
            selected.kind === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.url}
                alt=""
                className="mt-2 w-full h-32 object-cover rounded-lg bg-bg-soft"
              />
            ) : (
              <video
                src={selected.url}
                poster={service.media?.poster || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="mt-2 w-full h-32 object-cover rounded-lg bg-bg-soft"
              />
            )
          ) : (
            <p className="mt-2 text-[10px] font-mono text-fg-faint">
              Не выбрано — сайт возьмёт случайное фото из портфолио
            </p>
          )}
        </div>

        {/* Подпись под превью */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-fg-faint mb-2 block">
            Название кейса (подпись)
          </label>
          <input
            type="text"
            value={service.caseTitle}
            onChange={(e) => onChange({ caseTitle: e.target.value })}
            maxLength={80}
            placeholder="«Вечер у друзей»"
            className="w-full bg-bg-soft text-fg text-sm md:text-base p-3 rounded-xl border border-line focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Постер/обложка — только когда выбрано видео */}
      {service.media?.kind === "video" ? (
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-fg-faint mb-2 block">
            Обложка видео (фото-постер до старта)
          </label>
          <PosterPicker
            photos={media.filter((m) => m.kind === "photo")}
            value={service.media.poster ?? ""}
            onChange={(poster) =>
              onChange({
                media: service.media
                  ? {
                      kind: "video",
                      src: service.media.src,
                      ...(poster ? { poster } : {}),
                    }
                  : service.media,
              })
            }
          />
          <p className="mt-1 text-[10px] font-mono text-fg-faint">
            Показывается пока видео грузится. Если пусто — берётся
            авто-превью, сгенерированное при загрузке видео.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PosterPicker({
  photos,
  value,
  onChange,
}: {
  photos: MediaItem[];
  value: string;
  onChange: (poster: string) => void;
}) {
  return (
    <div className="flex gap-3 items-start">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-bg-soft text-fg text-sm font-mono p-3 rounded-xl border border-line focus:border-accent focus:outline-none transition-colors"
      >
        <option value="">— Авто (canvas-превью видео) —</option>
        {photos.map((p) => (
          <option key={p.key} value={p.url}>
            {p.key}
          </option>
        ))}
      </select>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="w-20 h-20 object-cover rounded-lg bg-bg-soft border border-line"
        />
      ) : null}
    </div>
  );
}

function MediaPicker({
  media,
  value,
  onChange,
}: {
  media: MediaItem[];
  value: ServiceMedia | null;
  onChange: (m: ServiceMedia | null) => void;
}) {
  const photos = media.filter((m) => m.kind === "photo");
  const videos = media.filter((m) => m.kind === "video");

  // Селектная value: пустая = авто, иначе "kind:::url"
  const currentValue = value ? `${value.kind}:::${value.src}` : "";

  const handle = (raw: string) => {
    if (!raw) {
      onChange(null);
      return;
    }
    const [kind, src] = raw.split(":::");
    if ((kind === "photo" || kind === "video") && src) {
      onChange({ kind, src });
    }
  };

  return (
    <select
      value={currentValue}
      onChange={(e) => handle(e.target.value)}
      className="w-full bg-bg-soft text-fg text-sm font-mono p-3 rounded-xl border border-line focus:border-accent focus:outline-none transition-colors"
    >
      <option value="">— Авто (случайное фото из портфолио) —</option>

      {photos.length > 0 ? (
        <optgroup label="📷 Фото">
          {photos.map((p) => (
            <option key={p.key} value={`photo:::${p.url}`}>
              {p.key}
            </option>
          ))}
        </optgroup>
      ) : null}

      {videos.length > 0 ? (
        <optgroup label="🎥 Видео">
          {videos.map((v) => (
            <option key={v.key} value={`video:::${v.url}`}>
              {v.key}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}

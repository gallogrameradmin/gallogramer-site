"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Photo, Video } from "@/app/lib/photos-source";
import Lightbox, { type LightboxItem } from "./Lightbox";
import CornerBrackets from "./CornerBrackets";
import ButtonAura from "./ButtonAura";
import DecorField from "./DecorField";
import EdgeMarks from "./EdgeMarks";

type Tab = "all" | "photo" | "video";

const ease = [0.22, 1, 0.36, 1] as const;

export default function PortfolioGrid({
  photos,
  videos,
}: {
  photos: Photo[];
  videos: Video[];
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Объединённый источник: всё к одному типу LightboxItem
  const items: LightboxItem[] = useMemo(() => {
    const photoItems = photos.map(
      (p) => ({ kind: "photo" as const, ...p }) satisfies LightboxItem,
    );
    const videoItems = videos.map(
      (v) => ({ kind: "video" as const, ...v }) satisfies LightboxItem,
    );
    if (tab === "photo") return photoItems;
    if (tab === "video") return videoItems;
    // all: видео сначала, потом фото
    return [...videoItems, ...photoItems];
  }, [tab]);

  const open = (i: number) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + items.length) % items.length,
    );
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % items.length));

  const isVideoEmpty = tab === "video" && videos.length === 0;

  return (
    <section className="relative overflow-hidden px-4 md:px-8 lg:px-12 pt-32 md:pt-40 pb-24 md:pb-32">
      {/* Декоративный фон */}
      <DecorField count={20} maxOpacity={0.12} />
      <EdgeMarks code="PAGE / P" label="PORTFOLIO" />

      <div className="relative max-w-[1600px] mx-auto">
        <div className="mb-12 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-4 inline-flex items-center gap-2">
              <span className="text-accent">/Portfolio</span>
              <span aria-hidden className="inline-block">
                <svg width="8" height="8" viewBox="0 0 10 10">
                  <line x1="0.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.6" className="text-accent" />
                  <line x1="5" y1="0.5" x2="5" y2="9.5" stroke="currentColor" strokeWidth="1.6" className="text-accent" />
                </svg>
              </span>
            </p>
            <h1 className="font-display font-medium tracking-[-0.04em] text-[clamp(2.5rem,8vw,7rem)] leading-[0.9]">
              Портфолио<span className="text-accent">.</span>
            </h1>
          </div>

          <nav className="relative isolate flex items-center gap-1 md:gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
            <ButtonAura
              className="-inset-16 md:-inset-20"
              opacity={0.7}
            />
            {(["all", "photo", "video"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full glass transition-colors ${
                  tab === t
                    ? "glass-active text-accent"
                    : "text-fg-faint hover:text-fg"
                }`}
              >
                {t === "all" ? "Все" : t === "photo" ? "Фото" : "Видео"}
              </button>
            ))}
          </nav>
        </div>

        {isVideoEmpty ? (
          <div className="py-32 md:py-48 text-center border border-line border-dashed">
            <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-3">
              [ video / coming soon ]
            </p>
            <p className="font-display text-3xl md:text-4xl tracking-[-0.02em] text-fg-muted">
              Скоро здесь будут ролики.
            </p>
            <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint/70 mt-4">
              /upload в Telegram-боте → кидай видео → /done
            </p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-3 [column-fill:_balance]">
            {items.map((item, i) => (
              <MediaCard
                key={item.src}
                item={item}
                index={i}
                onOpen={open}
              />
            ))}
          </div>
        )}
      </div>

      <Lightbox
        items={items}
        index={lightboxIndex}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </section>
  );
}

function MediaCard({
  item,
  index,
  onOpen,
}: {
  item: LightboxItem;
  index: number;
  onOpen: (i: number) => void;
}) {
  // Для видео аспект-рейшо не всегда есть в манифесте → fallback 16:9
  const w = "w" in item && item.w ? item.w : 16;
  const h = "h" in item && item.h ? item.h : 9;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(index)}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{
        duration: 0.6,
        ease,
        delay: Math.min(index * 0.015, 0.4),
      }}
      className="group relative mb-2 md:mb-3 block w-full break-inside-avoid overflow-hidden bg-bg-soft cursor-zoom-in"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      {item.kind === "photo" ? (
        <Image
          src={item.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.03]"
          loading={index < 8 ? undefined : "lazy"}
          priority={index < 4}
        />
      ) : (
        <VideoThumb video={item} />
      )}

      <div className="absolute top-2 left-2 text-[10px] font-mono text-bg/0 group-hover:text-bg/90 transition-colors mix-blend-difference">
        /{String(index + 1).padStart(3, "0")}
      </div>

      {item.kind === "video" ? (
        <div className="absolute top-2 right-2 text-[10px] font-mono tracking-[0.18em] uppercase bg-accent text-white px-2 py-1 pointer-events-none">
          video
        </div>
      ) : null}

      <div className="absolute inset-0 ring-1 ring-inset ring-fg/[0.04] group-hover:ring-accent/70 transition-[box-shadow] duration-300 pointer-events-none" />
      <CornerBrackets />
    </motion.button>
  );
}

function VideoThumb({
  video,
}: {
  video: { src: string; thumb: string | null };
}) {
  // Если есть готовый thumbnail из Telegram — используем картинку (быстро).
  // Иначе — нативный <video> с poster="metadata" подтянет первый кадр.
  if (video.thumb) {
    return (
      <>
        <Image
          src={video.thumb}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.03]"
        />
        <PlayBadge />
      </>
    );
  }
  return (
    <>
      <video
        src={video.src}
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <PlayBadge />
    </>
  );
}

function PlayBadge() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-14 h-14 rounded-full bg-bg/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-accent transition-colors">
        <span className="text-fg group-hover:text-white text-lg leading-none translate-x-[1px]">
          ▶
        </span>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Photo } from "@/app/lib/photos-source";
import type { ServiceContent } from "@/app/lib/content-source";
import DecorField from "./DecorField";
import EdgeMarks from "./EdgeMarks";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Services({
  photos,
  services,
}: {
  photos: Photo[];
  services: ServiceContent[];
}) {
  const [active, setActive] = useState(0);
  const currentService = services[active] ?? null;

  // Превью: если в услуге явно задано media (фото или видео) — используем его.
  // Иначе берём случайное фото из портфолио, чтобы карточка не пустовала.
  type Preview =
    | { kind: "photo"; src: string; w: number; h: number }
    | { kind: "video"; src: string; poster?: string };

  const currentPreview: Preview | null = (() => {
    if (!currentService) return null;
    const m = currentService.media;
    if (m?.kind === "video" && m.src) {
      return { kind: "video", src: m.src, poster: m.poster };
    }
    if (m?.kind === "photo" && m.src) {
      const found = photos.find((p) => p.src === m.src);
      if (found) return { kind: "photo", src: found.src, w: found.w, h: found.h };
      // Если фото удалили из портфолио — всё равно покажем по URL
      return { kind: "photo", src: m.src, w: 3, h: 4 };
    }
    if (photos.length === 0) return null;
    const auto = photos[(active * 13) % photos.length];
    return { kind: "photo", src: auto.src, w: auto.w, h: auto.h };
  })();

  return (
    <section
      id="services"
      className="relative overflow-hidden px-6 md:px-12 pt-24 md:pt-32 pb-12 md:pb-20"
    >
      {/* Декоративный фон */}
      <DecorField count={16} maxOpacity={0.14} />
      <EdgeMarks code="002 / A" label="SERVICES" />

      <div className="relative max-w-[1600px] mx-auto">
        {/* Заголовок справа сверху */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease }}
          className="flex flex-col items-end mb-10 md:mb-16"
        >
          <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-3 inline-flex items-center gap-2">
            <span className="text-accent">002</span>
            <span aria-hidden className="inline-block">
              <svg width="8" height="8" viewBox="0 0 10 10">
                <polygon points="5,1 9,9 1,9" className="fill-accent" />
              </svg>
            </span>
            <span>/ Services</span>
          </p>
          <h2 className="font-display font-medium tracking-[-0.04em] text-[clamp(3rem,8vw,7rem)] leading-[0.9] text-right">
            Услуги<span className="text-accent">.</span>
          </h2>
        </motion.div>

        {/* Двухколоночная сетка: превью слева, список справа */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
          {/* ───── ЛЕВАЯ: sticky превью текущего кейса (только md+) ───── */}
          <aside className="hidden md:block md:col-span-4 lg:col-span-3 md:order-1">
            <div className="md:sticky md:top-32">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.8, ease }}
                  className="group relative"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-bg-soft">
                    {currentPreview?.kind === "photo" ? (
                      <Image
                        src={currentPreview.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    ) : currentPreview?.kind === "video" ? (
                      <video
                        key={currentPreview.src}
                        src={currentPreview.src}
                        poster={currentPreview.poster || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 ring-1 ring-inset ring-fg/[0.08] pointer-events-none" />
                    {currentPreview?.kind === "video" ? (
                      <div className="absolute top-2 right-2 text-[9px] font-mono tracking-[0.18em] uppercase bg-accent text-white px-2 py-1 pointer-events-none">
                        video
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-4 text-base text-fg font-display tracking-[-0.01em]">
                    «{services[active].caseTitle}»
                  </p>
                  <p className="mt-1 text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-[6px] w-[6px] rounded-full bg-accent"
                    />
                    из портфолио
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </aside>

          {/* ───── ПРАВАЯ: вертикальный список услуг ───── */}
          <ul className="md:col-span-8 lg:col-span-9 order-1 md:order-2 border-t border-line">
            {services.map((s, i) => {
              const isActive = active === i;
              return (
                <li
                  key={s.title}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="relative border-b border-line py-6 md:py-8 cursor-pointer transition-colors duration-300 pl-4 md:pl-6"
                >
                  {/* Активный индикатор — вертикальная фиолетовая палочка */}
                  <motion.span
                    aria-hidden
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      scaleY: isActive ? 1 : 0.3,
                      width: isActive ? 3 : 1,
                    }}
                    transition={{ duration: 0.5, ease }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] bg-accent origin-center"
                  />

                  <motion.h3
                    initial={false}
                    animate={{
                      color: isActive
                        ? "var(--fg)"
                        : "var(--fg-faint)",
                    }}
                    transition={{ duration: 0.7, ease }}
                    className="font-display font-medium tracking-[-0.03em] text-[clamp(2rem,5.5vw,5rem)] leading-[1.02]"
                  >
                    {s.title}
                    {isActive ? (
                      <span className="text-accent">.</span>
                    ) : null}
                  </motion.h3>

                  <AnimatePresence initial={false}>
                    {isActive ? (
                      <motion.p
                        key="desc"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          marginTop: 16,
                        }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.7, ease }}
                        className="max-w-2xl text-base md:text-lg text-fg-muted leading-relaxed text-pretty overflow-hidden"
                      >
                        {s.description}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

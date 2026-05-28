"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Photo } from "@/app/lib/photos-source";
import DecorField from "./DecorField";
import EdgeMarks from "./EdgeMarks";

const ease = [0.22, 1, 0.36, 1] as const;

type Service = {
  title: string;
  description: string;
  // Индекс из photos[] для превью слева
  photoIdx: number;
  // Подпись под превью — название кейса/съёмки
  caseTitle: string;
};

const services: Service[] = [
  {
    title: "Репортаж",
    description:
      "Концерты, вечеринки, корпоративы. Снимаю, не отвлекая от процесса — отдаю 60-200 кадров за 5-7 дней.",
    photoIdx: 3,
    caseTitle: "Вечер у друзей",
  },
  {
    title: "Портрет",
    description:
      "Студия или локация. Для соцсетей, личного бренда, портфолио. 1-2 часа съёмки, 20-40 ретушированных кадров.",
    photoIdx: 15,
    caseTitle: "Личный портрет",
  },
  {
    title: "Видео",
    description:
      "Reels, тизеры, короткие ролики до 60 секунд. Съёмка + монтаж + музыка под ключ.",
    photoIdx: 28,
    caseTitle: "Реклама бренда",
  },
  {
    title: "Лукбук",
    description:
      "Коммерческая съёмка для брендов одежды, мерча, аксессуаров. Студия или улица, постпродакшен в едином ключе.",
    photoIdx: 42,
    caseTitle: "Бренд одежды",
  },
  {
    title: "Backstage",
    description:
      "Закулисье съёмок, репетиций, подготовки. Параллельно процессу, не вмешиваюсь в команду.",
    photoIdx: 55,
    caseTitle: "На съёмочной площадке",
  },
  {
    title: "Интервью",
    description:
      "Съёмка диалогов и подкастов с подготовленным светом. 2-3 камеры, чистый звук, чистовой монтаж.",
    photoIdx: 64,
    caseTitle: "Подкаст-интервью",
  },
];

export default function Services({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState(0);
  const currentPhoto =
    photos.length > 0
      ? photos[services[active].photoIdx % photos.length]
      : null;

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
                    {currentPhoto ? (
                      <Image
                        src={currentPhoto.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 ring-1 ring-inset ring-fg/[0.08] pointer-events-none" />
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

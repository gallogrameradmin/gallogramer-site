"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import CornerBrackets from "./CornerBrackets";
import { FillLink } from "./FillButton";
import ButtonAura from "./ButtonAura";

const ease = [0.22, 1, 0.36, 1] as const;

type Service = {
  title: string;
  tagline: string;
  bullets: string[];
};

// Услуги Славы — пишу с нуля под фотографа/видеографа в стиле брутализм.
const services: Service[] = [
  {
    title: "Репортаж",
    tagline: "Концерты, вечеринки, корпоративы. Снимаю, не отвлекая от процесса.",
    bullets: [
      "От 2 до 8 часов на локации",
      "60-200 финальных кадров",
      "Базовая цветокор, jpg + raw по запросу",
      "Готово за 5-7 дней",
    ],
  },
  {
    title: "Портрет",
    tagline: "Студия или локация. Для соцсетей, личного бренда, портфолио.",
    bullets: [
      "1-2 часа съёмки",
      "1-3 образа, смена локаций",
      "20-40 ретушированных кадров",
      "Готово за 3-5 дней",
    ],
  },
  {
    title: "Видео",
    tagline: "Reels, тизеры, короткие ролики до 60 секунд.",
    bullets: [
      "Съёмка + монтаж под ключ",
      "Подбор музыки и звукоряда",
      "Вертикаль / горизонталь",
      "До 3 правок включены",
    ],
  },
  {
    title: "Лукбук",
    tagline: "Коммерческая съёмка для брендов одежды, мерча, аксессуаров.",
    bullets: [
      "Студийный или уличный сет",
      "Координация с моделями",
      "Постпродакшен в едином ключе",
      "Передача прав согласовываем отдельно",
    ],
  },
  {
    title: "Backstage",
    tagline: "Закулисье съёмок, репетиций, подготовки. Документальный кадр.",
    bullets: [
      "Параллельно с основным процессом",
      "Не вмешиваюсь в команду",
      "Фото + короткие видеофрагменты",
      "Подходит для команд и продакшенов",
    ],
  },
  {
    title: "Интервью",
    tagline: "Съёмка диалогов и подкастов с подготовленным светом.",
    bullets: [
      "2-3 камеры, стабильный звук",
      "Свет под формат и пространство",
      "Чистовой монтаж по тайм-кодам",
      "Озвучка субтитрами по запросу",
    ],
  },
];

export default function ServicesGrid() {
  return (
    <section className="relative px-6 md:px-12 pt-32 md:pt-40 pb-24 md:pb-32">
      <div className="max-w-[1400px] mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="mb-16 md:mb-24 max-w-3xl"
        >
          <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-4">
            <span className="text-accent">/Services</span>
          </p>
          <h1 className="font-display font-medium tracking-[-0.04em] text-[clamp(2.5rem,8vw,7rem)] leading-[0.9]">
            Услуги<span className="text-accent">.</span>
          </h1>
          <p className="mt-8 text-base md:text-lg text-fg-muted leading-relaxed text-pretty">
            Снимаю под задачу — не под прайс-лист. Ниже короткий список того,
            что чаще всего заказывают. Если твоего формата нет —
            <Link
              href="/request"
              className="text-fg underline decoration-accent underline-offset-4 hover:text-accent transition-colors"
            >
              {" напиши в заявке"}
            </Link>
            , обсудим под твою историю.
          </p>
        </motion.div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {services.map((s, i) => (
            <motion.article
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease, delay: Math.min(i * 0.06, 0.4) }}
              className="group relative bg-bg-soft p-6 md:p-8 min-h-[260px] md:min-h-[300px] flex flex-col"
            >
              {/* Номер */}
              <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-fg-faint mb-6">
                /{String(i + 1).padStart(3, "0")}
              </div>

              {/* Тайтл + тэглайн */}
              <h2 className="font-display font-medium tracking-[-0.02em] text-2xl md:text-3xl leading-tight mb-3">
                {s.title}
                <span className="text-accent">.</span>
              </h2>
              <p className="text-sm md:text-base text-fg-muted leading-relaxed mb-6 text-pretty">
                {s.tagline}
              </p>

              {/* Буллеты — толкаются в низ карточки */}
              <ul className="mt-auto flex flex-col gap-2 pt-4 border-t border-line">
                {s.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-3 text-[12px] md:text-[13px] tracking-[0.04em] font-mono text-fg-muted leading-relaxed"
                  >
                    <span
                      aria-hidden
                      className="inline-block mt-[7px] h-[5px] w-[5px] rounded-full bg-accent shrink-0"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Hover-обводка + уголки */}
              <div className="absolute inset-0 ring-1 ring-inset ring-fg/[0.04] group-hover:ring-accent/60 transition-[box-shadow] duration-300 pointer-events-none" />
              <CornerBrackets />
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="mt-20 md:mt-28 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end"
        >
          <div className="lg:col-span-6">
            <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-4">
              <span className="text-accent">— ●</span> Следующий шаг
            </p>
            <p className="font-display font-medium tracking-[-0.03em] text-[clamp(1.5rem,4vw,3rem)] leading-[1.05] text-pretty">
              Расскажи, что снимаем — отвечу в течение суток.
            </p>
          </div>

          <div className="relative isolate lg:col-span-5 lg:col-start-8 flex flex-col gap-3 md:gap-4">
            <ButtonAura className="-inset-12" opacity={0.55} />
            <FillLink href="/request">
              <span className="relative">Отправить заявку</span>
              <span
                aria-hidden
                className="relative inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </FillLink>
            <FillLink href="https://t.me/gallogramer_bot" external>
              <span className="relative">Написать в Telegram</span>
              <span
                aria-hidden
                className="relative inline-block transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </FillLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

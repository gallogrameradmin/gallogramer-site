"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PricingItem } from "@/app/lib/content-source";
import CornerBrackets from "./CornerBrackets";
import DecorField from "./DecorField";
import EdgeMarks from "./EdgeMarks";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Pricing({ pricing }: { pricing: PricingItem[] }) {
  // Пустой массив = админ скрыл блок целиком, не рендерим секцию.
  if (!pricing || pricing.length === 0) return null;

  return (
    <section
      id="pricing"
      className="relative overflow-hidden px-6 md:px-12 pt-24 md:pt-32 pb-24 md:pb-32"
    >
      <DecorField count={14} maxOpacity={0.1} />
      <EdgeMarks code="004 / C" label="PRICING" />

      <div className="relative max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease }}
          className="flex flex-col items-start mb-10 md:mb-16"
        >
          <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-3 inline-flex items-center gap-2">
            <span className="text-accent">004</span>
            <span aria-hidden className="inline-block">
              <svg width="8" height="8" viewBox="0 0 10 10">
                <rect
                  x="1.5"
                  y="1.5"
                  width="7"
                  height="7"
                  className="fill-accent"
                />
              </svg>
            </span>
            <span>/ Pricing</span>
          </p>
          <h2 className="font-display font-medium tracking-[-0.04em] text-[clamp(3rem,8vw,7rem)] leading-[0.9]">
            Прайс<span className="text-accent">.</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm md:text-base text-fg-muted leading-relaxed">
            Базовые тарифы. Финальная стоимость зависит от объёма и сроков —
            пиши, обсудим под твою задачу.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {pricing.map((item, i) => (
            <PriceCard key={`${item.title}-${i}`} item={item} index={i} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="mt-10 text-[10px] md:text-[11px] tracking-[0.16em] uppercase font-mono text-fg-faint/70 text-center"
        >
          Все цены — ориентир. Точную смету согласовываем после брифа.
        </motion.p>
      </div>
    </section>
  );
}

function PriceCard({ item, index }: { item: PricingItem; index: number }) {
  const accentRing = item.highlight
    ? "ring-accent/60 hover:ring-accent"
    : "ring-fg/[0.06] hover:ring-accent/40";
  // ?service=<заголовок> — RequestForm подхватит и заполнит textarea «Что вам
  // нужно». Так пользователь сразу видит контекст выбранного тарифа.
  const href = `/request?service=${encodeURIComponent(item.title)}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease, delay: Math.min(index * 0.06, 0.4) }}
      className={`group relative bg-bg-soft/40 backdrop-blur-sm ring-1 ${accentRing} transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5`}
    >
      <Link
        href={href}
        aria-label={`Оставить заявку — ${item.title}`}
        className="block p-6 md:p-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent rounded-sm"
      >
        <CornerBrackets />

        {item.highlight ? (
          <div className="absolute top-3 right-3 text-[9px] font-mono tracking-[0.18em] uppercase bg-accent text-white px-2 py-0.5">
            выбор
          </div>
        ) : null}

        <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-fg-faint mb-3">
          /00{index + 1}
        </p>

        <h3 className="font-display font-medium tracking-[-0.02em] text-2xl md:text-3xl leading-[1.05] text-fg">
          {item.title}
        </h3>

        {item.description ? (
          <p className="mt-3 text-sm md:text-base text-fg-muted leading-relaxed text-pretty">
            {item.description}
          </p>
        ) : null}

        <div className="mt-6 pt-5 border-t border-line flex items-baseline gap-2 flex-wrap">
          <span
            className={`font-display tracking-[-0.02em] text-2xl md:text-3xl ${
              item.highlight ? "text-accent" : "text-fg"
            }`}
          >
            {item.price}
          </span>
          {item.unit ? (
            <span className="text-[11px] tracking-[0.14em] uppercase font-mono text-fg-faint">
              · {item.unit}
            </span>
          ) : null}
        </div>

        <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint group-hover:text-accent transition-colors">
          <span>Оставить заявку</span>
          <span
            aria-hidden
            className="inline-block transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

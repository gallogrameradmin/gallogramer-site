"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { photos } from "@/app/data/photos";
import CornerBrackets from "./CornerBrackets";

const ease = [0.22, 1, 0.36, 1] as const;

// 6 hand-picked indices spread across the archive
const picks = [0, 7, 18, 28, 42, 60].map((i) => photos[i % photos.length]);

export default function Featured() {
  return (
    <section id="works" className="relative px-6 md:px-12 py-24 md:py-40">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease }}
          className="flex items-end justify-between mb-10 md:mb-16"
        >
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-4">
              <span className="text-accent">002</span> / Works
            </p>
            <h2 className="font-display font-medium tracking-[-0.03em] text-[clamp(2rem,5vw,4rem)] leading-[0.95]">
              Работы<span className="text-accent">.</span>
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="hidden md:inline-flex items-center gap-2 text-sm tracking-[0.06em] uppercase font-mono text-fg-faint hover:text-fg transition-colors group"
          >
            <span>Смотреть все</span>
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {picks.map((p, i) => (
            <motion.div
              key={p.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease, delay: i * 0.07 }}
              className="relative overflow-hidden bg-bg-soft aspect-[4/5] group"
            >
              <Image
                src={p.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.04]"
                priority={i < 3}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-fg/[0.04] group-hover:ring-accent/60 transition-[box-shadow] duration-300 pointer-events-none" />
              <CornerBrackets />
              <div className="absolute top-2 left-2 text-[10px] font-mono text-bg/0 group-hover:text-bg/90 transition-colors mix-blend-difference">
                /{String(i + 1).padStart(3, "0")}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="md:hidden mt-8">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-sm tracking-[0.06em] uppercase font-mono text-fg-faint hover:text-fg transition-colors"
          >
            <span>Смотреть все</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

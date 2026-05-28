"use client";

import { motion, type MotionValue } from "framer-motion";
import { type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Большое имя «Slava Bober.» — принимает rotateX/rotateY извне (от HeroContent),
 * чтобы наклоняться по mouse position, но независимо от остальных элементов
 * сцены. Внутри буквы имеют статичный z-рельеф «зигзаг» — даёт глубину.
 */
export default function HeroName({
  rotateX,
  rotateY,
}: {
  rotateX?: MotionValue<number>;
  rotateY?: MotionValue<number>;
}) {
  return (
    <motion.h1
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className="font-display font-medium tracking-[-0.04em] leading-[0.88] text-fg select-none cursor-default"
    >
      <Line3D word="Slava" delay={0.15} />
      <Line3D word="Bober" delay={0.28} accentDot />
    </motion.h1>
  );
}

function Line3D({
  word,
  delay,
  accentDot,
}: {
  word: string;
  delay: number;
  accentDot?: boolean;
}) {
  const depths = computeDepths(word.length);

  return (
    <motion.span
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay }}
      className="block text-[clamp(4rem,14vw,13rem)]"
      style={{ transformStyle: "preserve-3d" }}
    >
      {word.split("").map((ch, i) => (
        <Letter3D key={i} z={depths[i]}>
          {ch}
        </Letter3D>
      ))}
      {accentDot ? (
        <Letter3D z={48} className="text-accent">
          .
        </Letter3D>
      ) : null}
    </motion.span>
  );
}

function Letter3D({
  children,
  z,
  className = "",
}: {
  children: ReactNode;
  z: number;
  className?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        transform: `translateZ(${z}px)`,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className={className}
    >
      {children}
    </span>
  );
}

function computeDepths(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const center = (n - 1) / 2;
    const dist = Math.abs(i - center);
    const base = (n / 2 - dist) * 8;
    out.push(i % 2 === 0 ? base : -base);
  }
  return out;
}

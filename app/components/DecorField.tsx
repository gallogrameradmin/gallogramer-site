"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

type Shape = "triangle" | "circle" | "square" | "plus" | "slash" | "cross" | "dot";

/**
 * Плавающее поле из мелких геометрических фигур.
 * Кладётся фоном в секцию (parent должен иметь position: relative и overflow: hidden).
 * Все фигуры — фиолетовый акцент с низкой прозрачностью, медленно дрейфуют.
 */
export default function DecorField({
  count = 14,
  className = "",
  shapes = ["triangle", "circle", "square", "plus", "slash", "cross", "dot"],
  maxOpacity = 0.18,
}: {
  count?: number;
  className?: string;
  shapes?: Shape[];
  maxOpacity?: number;
}) {
  // Детерминированные позиции — иначе SSR/CSR будут расходиться
  const items = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      type: shapes[i % shapes.length] as Shape,
      left: ((i * 37 + 13) % 92) + 4, // % внутри секции
      top: ((i * 53 + 7) % 86) + 7,
      size: 8 + ((i * 11) % 10), // 8-17px
      rotation: (i * 47) % 360,
      duration: 14 + ((i * 3) % 18), // 14-32s
      delay: (i * 0.8) % 7,
      driftX: 8 + ((i * 5) % 12),
      driftY: 14 + ((i * 7) % 18),
    }));
  }, [count, shapes]);

  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {items.map((s, i) => (
        <motion.span
          key={i}
          className="absolute block text-accent"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
          }}
          initial={{ opacity: 0, rotate: s.rotation, scale: 0.85 }}
          animate={{
            x: [0, s.driftX, -s.driftX * 0.5, 0],
            y: [0, -s.driftY, s.driftY * 0.4, 0],
            opacity: [
              maxOpacity * 0.2,
              maxOpacity,
              maxOpacity * 0.4,
              maxOpacity * 0.8,
              maxOpacity * 0.2,
            ],
            rotate: [s.rotation, s.rotation + 180, s.rotation + 360],
            scale: [0.85, 1.05, 0.95, 0.85],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ShapeSVG type={s.type} />
        </motion.span>
      ))}
    </div>
  );
}

function ShapeSVG({ type }: { type: Shape }) {
  const stroke = { stroke: "currentColor", strokeWidth: 1, fill: "none" } as const;
  switch (type) {
    case "triangle":
      return (
        <svg viewBox="0 0 10 10" width="100%" height="100%">
          <polygon points="5,1 9,9 1,9" {...stroke} />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox="0 0 10 10" width="100%" height="100%">
          <circle cx="5" cy="5" r="3.8" {...stroke} />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 10 10" width="100%" height="100%">
          <rect x="1.2" y="1.2" width="7.6" height="7.6" {...stroke} />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 10 10" width="100%" height="100%">
          <line x1="5" y1="0.5" x2="5" y2="9.5" {...stroke} />
          <line x1="0.5" y1="5" x2="9.5" y2="5" {...stroke} />
        </svg>
      );
    case "slash":
      return (
        <svg viewBox="0 0 10 10" width="100%" height="100%">
          <line x1="0.5" y1="9.5" x2="9.5" y2="0.5" {...stroke} />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 10 10" width="100%" height="100%">
          <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" {...stroke} />
          <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" {...stroke} />
        </svg>
      );
    case "dot":
      return (
        <svg viewBox="0 0 10 10" width="100%" height="100%">
          <circle cx="5" cy="5" r="2.2" fill="currentColor" />
        </svg>
      );
  }
}

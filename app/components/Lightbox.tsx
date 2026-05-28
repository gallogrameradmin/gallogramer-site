"use client";

import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { Photo } from "@/app/data/photos";
import type { Video } from "@/app/data/videos";

export type LightboxItem =
  | ({ kind: "photo" } & Photo)
  | ({ kind: "video" } & Video);

type LightboxProps = {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const open = index !== null;
  const item = open ? items[index] : null;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [open, onClose, onPrev, onNext],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] bg-bg/95 backdrop-blur-sm"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Закрыть"
            className="absolute top-4 right-4 md:top-6 md:right-6 z-10 text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint hover:text-fg transition-colors px-3 py-2"
          >
            Close ✕
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Предыдущая"
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 text-fg-faint hover:text-fg transition-colors p-3 font-mono"
          >
            ←
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Следующая"
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 text-fg-faint hover:text-fg transition-colors p-3 font-mono"
          >
            →
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint">
            {String((index ?? 0) + 1).padStart(3, "0")} /{" "}
            {String(items.length).padStart(3, "0")}
            {item.kind === "video" ? " · video" : ""}
          </div>

          <motion.div
            key={item.src}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 flex items-center justify-center p-12 md:p-16"
          >
            {item.kind === "photo" ? (
              <div
                className="relative max-w-full max-h-full"
                style={{ aspectRatio: `${item.w} / ${item.h}` }}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="100vw"
                  priority
                  className="object-contain"
                />
              </div>
            ) : (
              <video
                src={item.src}
                poster={item.thumb ?? undefined}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="max-w-full max-h-full"
              />
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

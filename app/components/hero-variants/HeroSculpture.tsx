"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import HeroName from "../HeroName";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  mode: "portrait" | "reach";
  portrait: string | null;
  reachBody: string | null;
  camera: string | null;
};

/**
 * V2 — Скульптурное / 3D-объём.
 * Тело клонируется 3 раза с разной z-глубиной и убывающей прозрачностью — даёт ощущение
 * рельефа / barelief. Усиленный rotateX/Y по курсору. Ground shadow под фигурой.
 * Не WebGL, всё через CSS 3D-transforms.
 */
export default function HeroSculpture({ reachBody, camera }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bodyScrollY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  // АГРЕССИВНЫЕ повороты — для скульптурного эффекта
  const bodySpring = { stiffness: 60, damping: 22, mass: 0.9 } as const;
  const bodyRY = useSpring(useTransform(mx, [-1, 1], [12, -12]), bodySpring);
  const bodyRX = useSpring(useTransform(my, [-1, 1], [-8, 8]), bodySpring);

  const camSpring = { stiffness: 110, damping: 14, mass: 0.4 } as const;
  const camRY = useSpring(useTransform(mx, [-1, 1], [-22, 22]), camSpring);
  const camRX = useSpring(useTransform(my, [-1, 1], [16, -16]), camSpring);
  const camTX = useSpring(useTransform(mx, [-1, 1], [-32, 32]), camSpring);
  const camTY = useSpring(useTransform(my, [-1, 1], [-20, 20]), camSpring);

  const nameSpring = { stiffness: 90, damping: 22, mass: 0.7 } as const;
  const nameRY = useSpring(useTransform(mx, [-1, 1], [-10, 10]), nameSpring);
  const nameRX = useSpring(useTransform(my, [-1, 1], [6, -6]), nameSpring);

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mx.set(Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2))));
    my.set(Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2))));
  };
  const onMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative min-h-[100svh] flex flex-col justify-end px-6 md:px-12 pb-12 md:pb-20 pt-32 overflow-hidden"
      style={{ perspective: 1400 }}
    >
      {reachBody && camera ? (
        <>
          {/* Аура */}
          <motion.div
            style={{
              right: "8.5vw",
              bottom: "9vh",
              width: "120vh",
              height: "120vh",
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease, delay: 0.4 }}
            className="absolute z-0 max-w-[1200px] max-h-[1200px] pointer-events-none rounded-full"
            aria-hidden
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(25,25,112,0.7) 0%, rgba(25,25,112,0.3) 45%, transparent 75%)",
                filter: "blur(40px)",
                opacity: 0.5,
              }}
            />
          </motion.div>

          {/* Ground shadow */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 0.6, scaleX: 1 }}
            transition={{ duration: 1.3, ease, delay: 0.5 }}
            className="absolute z-[5] pointer-events-none"
            style={{
              right: "10vw",
              bottom: "2vh",
              width: "32vw",
              height: "5vh",
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, transparent 70%)",
              filter: "blur(8px)",
            }}
            aria-hidden
          />

          {/* BODY — клонируется 3 раза для рельефа */}
          {[
            { z: -40, opacity: 0.18, scale: 1.03, blur: 8, delay: 0.2 },
            { z: -20, opacity: 0.45, scale: 1.015, blur: 3, delay: 0.28 },
            { z: 0, opacity: 1, scale: 1, blur: 0, delay: 0.35 },
          ].map((layer, idx) => (
            <motion.div
              key={idx}
              style={{
                y: bodyScrollY,
                rotateX: bodyRX,
                rotateY: bodyRY,
                transformStyle: "preserve-3d",
                translateZ: layer.z,
                right: "16vw",
                bottom: "24.5vh",
                height: "115vh",
              }}
              initial={{ opacity: 0, scale: layer.scale * 0.96 }}
              animate={{ opacity: layer.opacity, scale: layer.scale }}
              transition={{ duration: 1.1, ease, delay: layer.delay }}
              className="absolute z-10 max-h-[1100px] aspect-[2/3] pointer-events-none will-change-transform"
              aria-hidden
            >
              <Image
                src={reachBody}
                alt=""
                fill
                priority={idx === 2}
                sizes="(min-width: 1024px) 60vw, 80vw"
                className="object-contain object-bottom"
                style={
                  layer.blur > 0
                    ? { filter: `blur(${layer.blur}px)` }
                    : undefined
                }
              />
            </motion.div>
          ))}

          {/* Camera */}
          <motion.div
            style={{
              x: camTX,
              y: camTY,
              rotateX: camRX,
              rotateY: camRY,
              transformStyle: "preserve-3d",
              translateZ: 120,
              right: "19vw",
              bottom: "31vh",
              width: "18.5vw",
              aspectRatio: "10 / 7",
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease, delay: 0.6 }}
            className="absolute z-20 pointer-events-none will-change-transform"
            aria-hidden
          >
            <Image
              src={camera}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 18vw, 25vw"
              className="object-contain"
              style={{
                filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.4))",
              }}
            />
          </motion.div>
        </>
      ) : null}

      <div className="relative z-30 max-w-[1400px] w-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="text-xs md:text-sm tracking-[0.2em] uppercase font-mono text-fg-faint mb-6 md:mb-8"
        >
          <span className="text-accent">001</span> / Sculpture · Depth · Volume
        </motion.p>

        <HeroName rotateX={nameRX} rotateY={nameRY} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease, delay: 0.5 }}
          className="mt-10 md:mt-14 grid md:grid-cols-12 gap-6 md:gap-12 items-end"
        >
          <p className="md:col-span-6 text-base md:text-lg leading-relaxed text-fg-muted max-w-prose text-pretty">
            Начинающий фотограф и видеограф преимущественно в стиле{" "}
            <span className="text-fg">Брутализм</span>. Студент Колледжа
            Сценарных искусств и дизайна. Снимаю всё — от школьных праздников до
            закрытых вечеринок и корпоративных ивентов.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.2 }}
        className="absolute bottom-6 md:bottom-10 right-6 md:right-12 z-30 flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase font-mono text-fg-faint pointer-events-none"
      >
        <motion.span
          aria-hidden
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block h-3 w-px bg-accent"
        />
        scroll
      </motion.div>
    </section>
  );
}

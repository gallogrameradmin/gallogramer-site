"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import HeroName from "../HeroName";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  mode: "portrait" | "reach";
  portrait: string | null;
  reachBody: string | null;
  hand: string | null;
  camera: string | null;
};

/**
 * V1 — Кино / Атмосфера.
 * Три слоя — тело, рука, камера. Только translate-параллакс, без вращений и
 * scale-искажений: ничего не деформируется, только разные амплитуды смещения
 * дают ощущение глубины.
 *
 * Плюс кинематографичное окружение: виньет, цветокор, спотлайт от курсора, пылинки.
 */
export default function HeroCinema({ reachBody, hand, camera }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const [spot, setSpot] = useState({ x: -1000, y: -1000 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bodyScrollY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  // ─── Только translate, без rotate. Разные амплитуды = разная глубина ───
  // Body — дальний слой, движется меньше
  const bodySpring = { stiffness: 50, damping: 24, mass: 1.2 } as const;
  const bodyX = useSpring(useTransform(mx, [-1, 1], [10, -10]), bodySpring);
  const bodyY = useSpring(useTransform(my, [-1, 1], [6, -6]), bodySpring);

  // Hand — средний слой
  const handSpring = { stiffness: 75, damping: 18, mass: 0.7 } as const;
  const handX = useSpring(useTransform(mx, [-1, 1], [22, -22]), handSpring);
  const handY = useSpring(useTransform(my, [-1, 1], [14, -14]), handSpring);

  // Camera — ближний слой, движется сильнее всех
  const camSpring = { stiffness: 110, damping: 14, mass: 0.4 } as const;
  const camX = useSpring(useTransform(mx, [-1, 1], [38, -38]), camSpring);
  const camY = useSpring(useTransform(my, [-1, 1], [24, -24]), camSpring);

  // Имя — translate + лёгкий tilt чтобы 3D-рельеф букв стал виден
  const nameSpring = { stiffness: 90, damping: 22, mass: 0.7 } as const;
  const nameX = useSpring(useTransform(mx, [-1, 1], [-6, 6]), nameSpring);
  const nameY = useSpring(useTransform(my, [-1, 1], [-3, 3]), nameSpring);
  const nameRY = useSpring(useTransform(mx, [-1, 1], [-7, 7]), nameSpring);
  const nameRX = useSpring(useTransform(my, [-1, 1], [4, -4]), nameSpring);

  // Био — лёгкое движение с курсором
  const bioSpring = { stiffness: 70, damping: 18, mass: 0.5 } as const;
  const bioX = useSpring(useTransform(mx, [-1, 1], [-5, 5]), bioSpring);
  const bioY = useSpring(useTransform(my, [-1, 1], [-3, 3]), bioSpring);

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mx.set(Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2))));
    my.set(Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2))));
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const onMouseLeave = () => {
    mx.set(0);
    my.set(0);
    setSpot({ x: -1000, y: -1000 });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative min-h-[100svh] flex flex-col justify-end px-6 md:px-12 pb-12 md:pb-20 pt-32 overflow-hidden"
      style={{ perspective: 1600 }}
    >
      {/* Виньет */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0, var(--vignette-opacity, 0.6)) 100%)",
        }}
      />
      {/* Холодный цветокор */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-30 mix-blend-multiply"
        style={{
          background: "rgba(25, 25, 112, var(--tint-opacity, 0.20))",
        }}
      />
      {/* Spotlight от курсора */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 420px at ${spot.x}px ${spot.y}px, rgba(255,240,220,0.12) 0%, transparent 80%)`,
        }}
      />
      {/* Пылинки */}
      <DustField count={18} />

      {reachBody ? (
        <>
          {/* Аура */}
          <motion.div
            style={{
              right: "var(--aura-right, -6.5vw)",
              bottom: "var(--aura-bottom, -10vh)",
              width: "var(--aura-size, 120vh)",
              height: "var(--aura-size, 120vh)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease, delay: 0.4 }}
            className="absolute z-0 max-w-[1200px] max-h-[1200px] pointer-events-none rounded-full"
            aria-hidden
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, rgba(70,70,200,0.7) 0%, rgba(25,25,112,0.45) 30%, rgba(25,25,112,0.15) 60%, transparent 90%)",
                filter: "blur(60px)",
                opacity: "var(--aura-opacity, 0.85)",
              }}
            />
          </motion.div>

          {/*
            ─── КОМПОЗИЦИЯ: body + hand + camera в одном якоре ───
            Контейнер позиционирован к viewport (body-right/bottom/height).
            Body заполняет его 100%. Hand и Camera позиционируются ВНУТРИ него
            процентами — поэтому при любом разрешении экрана композиция
            не расползается: всё едет вместе с body.
            Mouse-параллакс остаётся независимым для каждого слоя.
          */}
          <div
            style={{
              right: "var(--body-right, 2.5vw)",
              bottom: "var(--body-bottom, 9vh)",
              height: "var(--body-height, 177vh)",
            }}
            className="absolute z-10 aspect-[2/3] pointer-events-none"
            aria-hidden
          >
            {/* ─── СЛОЙ 1: ТЕЛО (fill контейнера) ─── */}
            <motion.div
              style={{ y: bodyScrollY, x: bodyX }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, ease, delay: 0.35 }}
              className="absolute inset-0 will-change-transform text-fg"
            >
              <Image
                src={reachBody}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 60vw, 80vw"
                className="object-contain object-bottom"
                style={{
                  filter: "contrast(1.05) saturate(0.85) brightness(0.95)",
                }}
              />
            </motion.div>

            {/* ─── СЛОЙ 2: РУКА (позиция в % от body) ─── */}
            {hand ? (
              <motion.div
                style={{
                  x: handX,
                  y: handY,
                  right: "var(--hand-right, 5%)",
                  bottom: "var(--hand-bottom, 10%)",
                  width: "var(--hand-width, 80%)",
                  aspectRatio: "3 / 2",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease, delay: 0.5 }}
                className="absolute z-[15] will-change-transform text-fg"
              >
                {hand.endsWith(".svg") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={hand}
                    alt=""
                    className="w-full h-full object-contain object-bottom"
                  />
                ) : (
                  <Image
                    src={hand}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 1024px) 30vw, 50vw"
                    className="object-contain object-bottom"
                  />
                )}
              </motion.div>
            ) : null}

            {/* ─── СЛОЙ 3: КАМЕРА (позиция в % от body) ─── */}
            {camera ? (
              <motion.div
                style={{
                  x: camX,
                  y: camY,
                  right: "var(--cam-right, 18%)",
                  bottom: "var(--cam-bottom, 35%)",
                  width: "var(--cam-width, 45%)",
                  aspectRatio: "10 / 7",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9, ease, delay: 0.6 }}
                className="absolute z-20 will-change-transform text-fg"
              >
                <Image
                  src={camera}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 768px) 18vw, 25vw"
                  className="object-contain"
                />
              </motion.div>
            ) : null}
          </div>
        </>
      ) : null}

      {/* ─── ТЕКСТОВЫЙ СЛОЙ ─── */}
      <div className="relative z-40 max-w-[1400px] w-full">
        {/* CAPTION блок — собственный translate/scale */}
        <div
          style={{
            transform:
              "translate(var(--caption-x, 0px), var(--caption-y, 0px)) scale(var(--caption-scale, 1))",
            transformOrigin: "left center",
          }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="text-xs md:text-sm tracking-[0.2em] uppercase font-mono text-fg-faint mb-6 md:mb-8"
          >
            <span className="text-accent">001</span> / Cinema · Photo · Video
          </motion.p>
        </div>

        {/* NAME блок — собственный translate/scale + mouse-driven анимация внутри */}
        <div
          style={{
            transform:
              "translate(var(--name-x, 0px), var(--name-y, 0px)) scale(var(--name-scale, 1))",
            transformOrigin: "left center",
          }}
        >
          <motion.div
            style={{
              x: nameX,
              y: nameY,
              transformStyle: "preserve-3d",
            }}
          >
            <HeroName rotateX={nameRX} rotateY={nameRY} />
          </motion.div>
        </div>

        {/* BIO блок — собственный translate/scale/max-width */}
        <div
          style={{
            transform:
              "translate(var(--bio-x, 0px), var(--bio-y, 0px)) scale(var(--bio-scale, 1))",
            transformOrigin: "left center",
            maxWidth: "var(--bio-max-w, 100%)",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease, delay: 0.5 }}
            style={{ x: bioX, y: bioY }}
            className="mt-10 md:mt-14 grid md:grid-cols-12 gap-6 md:gap-12 items-end will-change-transform"
          >
            <p className="md:col-span-6 text-base md:text-lg leading-relaxed text-fg-muted max-w-prose text-pretty">
              Начинающий фотограф и видеограф преимущественно в стиле{" "}
              <span className="text-fg">Брутализм</span>. Студент Колледжа
              Сценарных искусств и дизайна. Снимаю всё — от школьных праздников до
              закрытых вечеринок и корпоративных ивентов.
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.2 }}
        className="absolute bottom-6 md:bottom-10 right-6 md:right-12 z-40 flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase font-mono text-fg-faint pointer-events-none"
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

function DustField({ count }: { count: number }) {
  const dots = Array.from({ length: count }, (_, i) => ({
    left: (i * 37 + 13) % 100,
    top: ((i * 53 + 7) % 90) + 5,
    size: 1 + ((i * 11) % 3),
    duration: 8 + ((i * 3) % 12),
    delay: (i * 0.7) % 6,
  }));
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none z-20">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/40"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 8, -4, 0],
            opacity: [0.1, 0.6, 0.2, 0.5, 0.1],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import HeroName from "./HeroName";

const ease = [0.22, 1, 0.36, 1] as const;

type Mode = "portrait" | "reach";

export default function HeroContent({
  mode,
  portrait,
  reachBody,
  camera,
}: {
  mode: Mode;
  portrait: string | null;
  reachBody: string | null;
  camera: string | null;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-параллакс для портретного режима
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const portraitScrollY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  // ───── Mouse tracking ─────
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Caption — лёгкий drift против курсора
  const capSpring = { stiffness: 60, damping: 20, mass: 0.4 } as const;
  const capX = useSpring(useTransform(mx, [-1, 1], [12, -12]), capSpring);
  const capY = useSpring(useTransform(my, [-1, 1], [8, -8]), capSpring);

  // Имя — лёгкий тильт, тяжёлая пружина
  const nameSpring = { stiffness: 90, damping: 24, mass: 0.7 } as const;
  const nameRY = useSpring(useTransform(mx, [-1, 1], [-7, 7]), nameSpring);
  const nameRX = useSpring(useTransform(my, [-1, 1], [4, -4]), nameSpring);

  // Bio — drift по курсору, средняя пружина
  const bioSpring = { stiffness: 80, damping: 16, mass: 0.5 } as const;
  const bioX = useSpring(useTransform(mx, [-1, 1], [-6, 6]), bioSpring);
  const bioY = useSpring(useTransform(my, [-1, 1], [-4, 4]), bioSpring);

  // ───── REACH MODE: два независимых слоя ─────
  // Тело — тяжёлое, лениво крутится
  const bodySpring = { stiffness: 50, damping: 24, mass: 1.1 } as const;
  const bodyRY = useSpring(useTransform(mx, [-1, 1], [6, -6]), bodySpring);
  const bodyRX = useSpring(useTransform(my, [-1, 1], [-4, 4]), bodySpring);
  const bodyTX = useSpring(useTransform(mx, [-1, 1], [10, -10]), bodySpring);
  const bodyTY = useSpring(useTransform(my, [-1, 1], [6, -6]), bodySpring);

  // КАМЕРА — лёгкая, снэппи, БОЛЬШИЕ амплитуды, ПРОТИВОПОЛОЖНОЕ вращение от тела
  // Эффект: при мыши вправо тело наклоняется вправо, камера — влево → "рука качает камеру"
  const camSpring = { stiffness: 110, damping: 14, mass: 0.4 } as const;
  const camRY = useSpring(useTransform(mx, [-1, 1], [-22, 22]), camSpring);
  const camRX = useSpring(useTransform(my, [-1, 1], [16, -16]), camSpring);
  const camTX = useSpring(useTransform(mx, [-1, 1], [-32, 32]), camSpring);
  const camTY = useSpring(useTransform(my, [-1, 1], [-20, 20]), camSpring);

  // Portrait-mode (запасной) — для одиночного фото на правой стороне
  const portraitSpring = { stiffness: 55, damping: 22, mass: 1 } as const;
  const portraitRY = useSpring(
    useTransform(mx, [-1, 1], [10, -10]),
    portraitSpring,
  );
  const portraitRX = useSpring(
    useTransform(my, [-1, 1], [-8, 8]),
    portraitSpring,
  );
  const portraitTX = useSpring(
    useTransform(mx, [-1, 1], [16, -16]),
    portraitSpring,
  );

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / (rect.width / 2);
    const ny = (e.clientY - cy) / (rect.height / 2);
    mx.set(Math.max(-1, Math.min(1, nx)));
    my.set(Math.max(-1, Math.min(1, ny)));
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
      style={{ perspective: 1600 }}
    >
      {/* ───── REACH MODE ───── */}
      {mode === "reach" && reachBody && camera ? (
        <>
          {/* Фиолетовая аура — еле заметная сфера за фигурой */}
          <PurpleAura x={bodyTX} y={bodyTY} />
          {/* Слой 1 — тело */}
          <BodyLayer
            src={reachBody}
            x={bodyTX}
            y={bodyTY}
            rotateX={bodyRX}
            rotateY={bodyRY}
          />
          {/* Слой 2 — камера, поверх всего, противофазная физика */}
          <CameraLayer
            src={camera}
            x={camTX}
            y={camTY}
            rotateX={camRX}
            rotateY={camRY}
          />
        </>
      ) : null}

      {/* ───── PORTRAIT MODE (запасной) ───── */}
      {mode === "portrait" && portrait ? (
        <motion.div
          style={{
            y: portraitScrollY,
            scale: portraitScale,
            x: portraitTX,
            rotateY: portraitRY,
            rotateX: portraitRX,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease, delay: 0.4 }}
          className="absolute right-4 md:right-12 bottom-0 z-0 w-[58vw] sm:w-[46vw] md:w-[42vw] lg:w-[36vw] max-w-[520px] aspect-[3/4] pointer-events-none will-change-transform"
          aria-hidden
        >
          <Image
            src={portrait}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 36vw, (min-width: 768px) 42vw, 58vw"
            className="object-cover object-top"
          />
          <span className="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-[0.18em] text-bg/90 mix-blend-difference">
            /author
          </span>
        </motion.div>
      ) : null}

      {/* ───── PLACEHOLDER (если вообще ничего нет) ───── */}
      {mode === "portrait" && !portrait ? <PortraitPlaceholder /> : null}

      {/* ───── ТЕКСТОВЫЙ СЛОЙ ───── */}
      <div className="relative z-10 max-w-[1400px] w-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          style={{ x: capX, y: capY }}
          className="text-xs md:text-sm tracking-[0.2em] uppercase font-mono text-fg-faint mb-6 md:mb-8 will-change-transform"
        >
          <span className="text-accent">001</span> / Brutalism · Photo · Video
        </motion.p>

        <HeroName rotateX={nameRX} rotateY={nameRY} />

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

/**
 * Слой 1 — тело в позе летящего/тянущегося.
 * Лежит позади имени (z-0), занимает правую часть hero.
 */
function BodyLayer({
  src,
  x,
  y,
  rotateX,
  rotateY,
}: {
  src: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
}) {
  const isSvg = src.endsWith(".svg");
  return (
    <motion.div
      style={{
        x,
        y,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        translateZ: 30,
        right: "var(--body-right, 16vw)",
        bottom: "var(--body-bottom, 24.5vh)",
        height: "var(--body-height, 115vh)",
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease, delay: 0.35 }}
      className="absolute z-10 max-h-[900px] aspect-[2/3] pointer-events-none will-change-transform text-fg"
    >
      {isSvg ? (
        // SVG-placeholder — рендерится цветом currentColor (=text-fg), наследует тему
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain object-bottom"
          style={{ filter: "drop-shadow(0 0 1px currentColor)" }}
        />
      ) : (
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 80vw"
          className="object-contain object-bottom"
        />
      )}
    </motion.div>
  );
}

/**
 * Фиолетовая аура за фигурой. Мягкая сфера #191970 с blur,
 * чуть-чуть параллаксит вместе с телом (но мягче).
 */
function PurpleAura({
  x,
  y,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <motion.div
      style={{
        x,
        y,
        right: "var(--aura-right, 8.5vw)",
        bottom: "var(--aura-bottom, 9vh)",
        width: "var(--aura-size, 120vh)",
        height: "var(--aura-size, 120vh)",
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.8, ease, delay: 0.5 }}
      className="absolute z-0 max-w-[800px] max-h-[800px] pointer-events-none rounded-full will-change-transform"
      aria-hidden
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(25,25,112,0.7) 0%, rgba(25,25,112,0.3) 45%, transparent 75%)",
          filter: "blur(40px)",
          opacity: "var(--aura-opacity, 0.46)",
        }}
      />
    </motion.div>
  );
}

/**
 * Слой 2 — камера. Поверх всего (z-20, translateZ +90).
 * Двигается с большей амплитудой и в противоположную сторону.
 */
function CameraLayer({
  src,
  x,
  y,
  rotateX,
  rotateY,
}: {
  src: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
}) {
  const isSvg = src.endsWith(".svg");
  return (
    <motion.div
      style={{
        x,
        y,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        translateZ: 90,
        right: "var(--cam-right, 19vw)",
        bottom: "var(--cam-bottom, 31vh)",
        width: "var(--cam-width, 18.5vw)",
        aspectRatio: "10 / 7",
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease, delay: 0.6 }}
      className="absolute z-20 pointer-events-none will-change-transform text-fg"
      aria-hidden
    >
      {isSvg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain"
          style={{ filter: "drop-shadow(0 0 1px currentColor)" }}
        />
      ) : (
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 26vw, 36vw"
          className="object-contain"
        />
      )}
    </motion.div>
  );
}

function PortraitPlaceholder() {
  return (
    <div className="absolute right-6 md:right-12 bottom-12 md:bottom-20 z-0 w-[60vw] sm:w-[40vw] md:w-[34vw] lg:w-[28vw] max-w-[420px] aspect-[3/4] bg-bg-soft border border-dashed border-line flex flex-col items-center justify-center text-center p-6 gap-4 pointer-events-none">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-fg-faint">
        [ photo slot ]
      </div>
      <div className="font-display text-2xl md:text-3xl text-fg-muted tracking-[-0.02em] leading-tight">
        Положи сюда<br />
        <span className="text-fg">/public/me.png</span>
      </div>
      <div className="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint">
        /author
      </div>
      <div aria-hidden className="absolute top-2 right-2 text-fg-faint">+</div>
      <div aria-hidden className="absolute bottom-2 left-2 text-fg-faint">+</div>
      <div aria-hidden className="absolute bottom-2 right-2 text-fg-faint">+</div>
    </div>
  );
}

"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, OrthographicCamera } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { motion } from "framer-motion";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import HeroName from "../HeroName";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  mode: "portrait" | "reach";
  portrait: string | null;
  reachBody: string | null;
  hand?: string | null;
  camera: string | null;
  bio?: string;
};

/**
 * V3 — Настоящая 3D-сцена через React Three Fiber.
 * Тело и камера — текстурированные plane'ы в реальной 3D-сцене.
 * Перспективная камера, мягкие тени, bloom-постпроцесс, лёгкая хроматическая аберрация.
 * Сцена реагирует на движение курсора (orbit-effect).
 */
export default function HeroWebGL({ reachBody, camera }: Props) {
  if (!reachBody || !camera) {
    return (
      <section className="relative min-h-[100svh] flex items-center justify-center">
        <p className="text-fg-muted font-mono text-sm">
          WebGL вариант требует me-reach.png и camera.png
        </p>
      </section>
    );
  }
  return (
    <section className="relative min-h-[100svh] flex flex-col justify-end px-6 md:px-12 pb-12 md:pb-20 pt-32 overflow-hidden">
      {/* 3D-сцена занимает всё фоном */}
      <div className="absolute inset-0 z-0">
        <Canvas
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Scene bodySrc={reachBody} cameraSrc={camera} />
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.5}
                luminanceThreshold={0.3}
                luminanceSmoothing={0.9}
                mipmapBlur
              />
              <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={new THREE.Vector2(0.0008, 0.0008)}
                radialModulation={false}
                modulationOffset={0}
              />
              <Vignette eskil={false} offset={0.18} darkness={0.85} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      {/* Текстовый слой поверх Canvas */}
      <div className="relative z-30 max-w-[1400px] w-full pointer-events-none">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="text-xs md:text-sm tracking-[0.2em] uppercase font-mono text-fg-faint mb-6 md:mb-8"
        >
          <span className="text-accent">001</span> / Three.js · WebGL · Real 3D
        </motion.p>

        <HeroName />

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

function Scene({
  bodySrc,
  cameraSrc,
}: {
  bodySrc: string;
  cameraSrc: string;
}) {
  const bodyTex = useTexture(bodySrc);
  const camTex = useTexture(cameraSrc);
  // Премиум: бережём прозрачность PNG
  bodyTex.colorSpace = THREE.SRGBColorSpace;
  camTex.colorSpace = THREE.SRGBColorSpace;

  const { viewport, pointer } = useThree();
  const bodyRef = useRef<THREE.Mesh>(null);
  const camRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  // Пропорции тела (PNG ~2/3)
  const bodyAspect = 2 / 3;
  const bodyHeight = viewport.height * 0.95;
  const bodyWidth = bodyHeight * bodyAspect;

  // Пропорции камеры
  const camAspect = 10 / 7;
  const camWidth = viewport.width * 0.18;
  const camHeight = camWidth / camAspect;

  useFrame(() => {
    if (bodyRef.current) {
      // Тело лениво поворачивается за курсором
      bodyRef.current.rotation.y = THREE.MathUtils.lerp(
        bodyRef.current.rotation.y,
        pointer.x * 0.25,
        0.04,
      );
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(
        bodyRef.current.rotation.x,
        -pointer.y * 0.12,
        0.04,
      );
    }
    if (camRef.current) {
      // Камера — быстрее и в противофазе
      camRef.current.rotation.y = THREE.MathUtils.lerp(
        camRef.current.rotation.y,
        -pointer.x * 0.6,
        0.12,
      );
      camRef.current.rotation.x = THREE.MathUtils.lerp(
        camRef.current.rotation.x,
        pointer.y * 0.4,
        0.12,
      );
      // Drift в противоположную сторону
      const targetX = -pointer.x * 0.4;
      const targetY = -pointer.y * 0.25;
      camRef.current.position.x = THREE.MathUtils.lerp(
        camRef.current.position.x,
        viewport.width * 0.18 + targetX,
        0.12,
      );
      camRef.current.position.y = THREE.MathUtils.lerp(
        camRef.current.position.y,
        -viewport.height * 0.05 + targetY,
        0.12,
      );
    }
    if (auraRef.current) {
      auraRef.current.rotation.z += 0.001;
    }
  });

  const auraGeometry = useMemo(() => new THREE.CircleGeometry(1, 64), []);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 5]}
        zoom={100}
        near={0.1}
        far={100}
      />
      <ambientLight intensity={1} />
      <directionalLight position={[2, 3, 2]} intensity={0.4} />

      {/* Фиолетовая аура */}
      <mesh
        ref={auraRef}
        position={[viewport.width * 0.15, -viewport.height * 0.05, -1]}
        geometry={auraGeometry}
      >
        <meshBasicMaterial transparent opacity={0.55}>
          <canvasTexture
            attach="map"
            args={[makeAuraCanvas()]}
            colorSpace={THREE.SRGBColorSpace}
          />
        </meshBasicMaterial>
      </mesh>

      {/* Тело */}
      <mesh
        ref={bodyRef}
        position={[viewport.width * 0.22, -viewport.height * 0.05, 0]}
      >
        <planeGeometry args={[bodyWidth, bodyHeight]} />
        <meshBasicMaterial map={bodyTex} transparent toneMapped={false} />
      </mesh>

      {/* Камера — впереди тела */}
      <mesh ref={camRef} position={[viewport.width * 0.18, -viewport.height * 0.05, 0.5]}>
        <planeGeometry args={[camWidth, camHeight]} />
        <meshBasicMaterial map={camTex} transparent toneMapped={false} />
      </mesh>
    </>
  );
}

/**
 * Рисует мягкий radial-gradient #191970 на canvas, чтобы использовать как текстуру ауры.
 */
function makeAuraCanvas() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, "rgba(70, 70, 200, 0.9)");
  grad.addColorStop(0.4, "rgba(25, 25, 112, 0.5)");
  grad.addColorStop(0.8, "rgba(25, 25, 112, 0.1)");
  grad.addColorStop(1, "rgba(25, 25, 112, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

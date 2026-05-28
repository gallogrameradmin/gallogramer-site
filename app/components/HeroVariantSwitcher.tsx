"use client";

import { useEffect, useState } from "react";

export type HeroVariant = "baseline" | "cinema" | "sculpture" | "webgl";

const VARIANTS: { id: HeroVariant; label: string; desc: string }[] = [
  { id: "baseline", label: "V0 · Baseline", desc: "Зафиксированный текущий вид" },
  { id: "cinema", label: "V1 · Кино", desc: "Атмосфера, туман, цветокор" },
  { id: "sculpture", label: "V2 · Объём", desc: "Многослойная глубина, CSS-3D" },
  { id: "webgl", label: "V3 · WebGL", desc: "Реальная 3D-сцена" },
];

const STORAGE_KEY = "hero-variant";

export function useHeroVariant(): HeroVariant {
  const [variant, setVariant] = useState<HeroVariant>("cinema");

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get("hero") as HeroVariant | null;
      const stored = localStorage.getItem(STORAGE_KEY) as HeroVariant | null;
      const initial =
        fromUrl && isValid(fromUrl)
          ? fromUrl
          : stored && isValid(stored)
            ? stored
            : "cinema";
      setVariant(initial);
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && isValid(e.newValue)) {
        setVariant(e.newValue as HeroVariant);
      }
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && isValid(detail)) setVariant(detail);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("hero-variant-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hero-variant-change", onCustom);
    };
  }, []);

  return variant;
}

function isValid(v: string): v is HeroVariant {
  return ["baseline", "cinema", "sculpture", "webgl"].includes(v);
}

export default function HeroVariantSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<HeroVariant>("cinema");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as HeroVariant | null;
      if (stored && isValid(stored)) setCurrent(stored);
    } catch {}
  }, []);

  const pick = (v: HeroVariant) => {
    setCurrent(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
    window.dispatchEvent(
      new CustomEvent("hero-variant-change", { detail: v }),
    );
  };

  return (
    <div className="fixed top-16 left-4 z-[100] font-mono">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bg-accent text-white px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase rounded-full shadow-lg hover:bg-fg transition-colors"
      >
        {open ? "Close" : `Hero ${current.toUpperCase()}`}
      </button>

      {open ? (
        <div className="mt-2 bg-bg-soft border border-line p-3 w-[260px] rounded-md shadow-2xl">
          <div className="text-[10px] tracking-[0.18em] uppercase text-fg-faint mb-2">
            Hero variants
          </div>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => pick(v.id)}
              className={`w-full text-left p-2 mb-1 border transition-colors ${
                current === v.id
                  ? "border-accent bg-accent/10 text-fg"
                  : "border-line text-fg-faint hover:text-fg hover:border-fg/40"
              }`}
            >
              <div className="text-[11px] tracking-[0.14em] uppercase">
                {v.label}
              </div>
              <div className="text-[10px] text-fg-faint mt-0.5">{v.desc}</div>
            </button>
          ))}
          <p className="text-[9px] tracking-[0.14em] uppercase text-fg-faint/70 mt-2 leading-relaxed">
            Выбор сохраняется в localStorage. Можно зашарить через <code>?hero=cinema</code>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

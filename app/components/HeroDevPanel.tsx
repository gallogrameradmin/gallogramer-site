"use client";

import { useEffect, useState } from "react";

type Knob = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: "vw" | "vh" | "%" | "px" | "s";
  default: number;
};

const KNOBS: Knob[] = [
  // ─── ТЕЛО — позиция к viewport ───
  { key: "body-right", label: "Body · right", min: -50, max: 60, step: 0.5, suffix: "vw", default: -8 },
  { key: "body-bottom", label: "Body · bottom", min: -80, max: 100, step: 0.5, suffix: "vh", default: 0 },
  { key: "body-height", label: "Body · height", min: 20, max: 280, step: 1, suffix: "vh", default: 70 },
  // ─── РУКА — позиция в % от body ───
  { key: "hand-right", label: "Hand · right (% body)", min: -50, max: 100, step: 0.5, suffix: "%", default: 5 },
  { key: "hand-bottom", label: "Hand · bottom (% body)", min: -50, max: 100, step: 0.5, suffix: "%", default: 10 },
  { key: "hand-width", label: "Hand · width (% body)", min: 10, max: 200, step: 0.5, suffix: "%", default: 80 },
  // ─── КАМЕРА — позиция в % от body ───
  { key: "cam-right", label: "Camera · right (% body)", min: -50, max: 100, step: 0.5, suffix: "%", default: 18 },
  { key: "cam-bottom", label: "Camera · bottom (% body)", min: -50, max: 100, step: 0.5, suffix: "%", default: 35 },
  { key: "cam-width", label: "Camera · width (% body)", min: 5, max: 150, step: 0.5, suffix: "%", default: 45 },
  // ─── АУРА ───
  { key: "aura-right", label: "Aura · right", min: -80, max: 80, step: 0.5, suffix: "vw", default: -20 },
  { key: "aura-bottom", label: "Aura · bottom", min: -80, max: 80, step: 0.5, suffix: "vh", default: -15 },
  { key: "aura-size", label: "Aura · size", min: 10, max: 320, step: 1, suffix: "vh", default: 90 },
  { key: "aura-opacity", label: "Aura · opacity", min: 0, max: 100, step: 1, suffix: "%", default: 70 },
  // ─── ФОН (виньет + цветокор) ───
  { key: "vignette-opacity", label: "Vignette opacity", min: 0, max: 100, step: 1, suffix: "%", default: 60 },
  { key: "tint-opacity", label: "Tint opacity", min: 0, max: 100, step: 1, suffix: "%", default: 20 },
  // ─── CAPTION (001 / Cinema · Photo · Video) ───
  { key: "caption-x", label: "Caption · x", min: -200, max: 200, step: 1, suffix: "px", default: 0 },
  { key: "caption-y", label: "Caption · y", min: -400, max: 400, step: 2, suffix: "px", default: 0 },
  { key: "caption-scale", label: "Caption · scale", min: 50, max: 200, step: 1, suffix: "%", default: 100 },
  // ─── NAME (Slava Bober) ───
  { key: "name-x", label: "Name · x", min: -200, max: 200, step: 1, suffix: "px", default: 0 },
  { key: "name-y", label: "Name · y", min: -500, max: 500, step: 2, suffix: "px", default: 0 },
  { key: "name-scale", label: "Name · scale", min: 30, max: 180, step: 1, suffix: "%", default: 100 },
  // ─── BIO (описание) ───
  { key: "bio-x", label: "Bio · x", min: -200, max: 200, step: 1, suffix: "px", default: 0 },
  { key: "bio-y", label: "Bio · y", min: -500, max: 500, step: 2, suffix: "px", default: 0 },
  { key: "bio-scale", label: "Bio · scale", min: 60, max: 160, step: 1, suffix: "%", default: 100 },
  { key: "bio-max-w", label: "Bio · max width", min: 20, max: 100, step: 1, suffix: "vw", default: 100 },
  // ─── HEADER ───
  { key: "header-pl", label: "Header · left padding", min: 0, max: 60, step: 1, suffix: "px", default: 16 },
  { key: "header-pr", label: "Header · right padding", min: 0, max: 60, step: 1, suffix: "px", default: 16 },
  { key: "header-py", label: "Header · vertical padding", min: 6, max: 40, step: 1, suffix: "px", default: 20 },
  { key: "logo-h", label: "Logo · height", min: 12, max: 60, step: 1, suffix: "px", default: 24 },
  { key: "nav-size", label: "Nav · font size", min: 6, max: 20, step: 0.5, suffix: "px", default: 9 },
  { key: "nav-gap", label: "Nav · gap between items", min: 2, max: 40, step: 1, suffix: "px", default: 10 },
  // ─── MARQUEE ───
  { key: "mobile-marquee-duration", label: "Marquee · duration (сек)", min: 4, max: 40, step: 0.5, suffix: "s", default: 12 },
];

type Mode = "mobile" | "tablet" | "tablet-wide" | "desktop";

const MODES: Record<Mode, { storageKey: string; styleId: string; mediaQuery: string; label: string }> = {
  mobile: {
    storageKey: "hero-mobile-dev-knobs",
    styleId: "hero-mobile-dev-overrides",
    mediaQuery: "@media (max-width: 767px)",
    label: "MOBILE ≤767px",
  },
  tablet: {
    storageKey: "hero-tablet-dev-knobs",
    styleId: "hero-tablet-dev-overrides",
    mediaQuery: "@media (min-width: 768px) and (max-width: 1023px)",
    label: "TABLET 768-1023px",
  },
  "tablet-wide": {
    storageKey: "hero-tablet-wide-dev-knobs",
    styleId: "hero-tablet-wide-dev-overrides",
    mediaQuery: "@media (min-width: 1024px) and (max-width: 1279px)",
    label: "TABLET WIDE 1024-1279px",
  },
  desktop: {
    storageKey: "hero-desktop-dev-knobs",
    styleId: "hero-desktop-dev-overrides",
    mediaQuery: "@media (min-width: 1280px)",
    label: "DESKTOP ≥1280px",
  },
};

function detectMode(): Mode | null {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  if (w < 1280) return "tablet-wide";
  return "desktop";
}

function defaultValues() {
  const v: Record<string, number> = {};
  for (const k of KNOBS) v[k.key] = k.default;
  return v;
}

function format(k: Knob, v: number): string {
  // Opacity ключи (aura/vignette/tint-opacity) — decimal 0..1
  if (k.key.endsWith("-opacity")) return String(v / 100);
  // Scale ключи (caption/name/bio-scale) — decimal 0..N (CSS transform scale хочет number)
  if (k.key.endsWith("-scale")) return String(v / 100);
  // Остальные "%" — CSS-длина "X%"
  if (k.suffix === "%") return `${v}%`;
  if (k.suffix === "px") return `${v}px`;
  return `${v}${k.suffix}`;
}

function applyOverrides(mode: Mode, values: Record<string, number>) {
  const cfg = MODES[mode];
  let style = document.getElementById(cfg.styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = cfg.styleId;
    document.head.appendChild(style);
  }
  const lines = KNOBS.map((k) => {
    const v = values[k.key] ?? k.default;
    return `    --${k.key}: ${format(k, v)};`;
  });
  style.textContent = `${cfg.mediaQuery} {\n  :root {\n${lines.join("\n")}\n  }\n}`;
}

/**
 * Hero dev-панель. Покрывает все диапазоны:
 *   • mobile ≤767
 *   • tablet 768-1023
 *   • tablet-wide 1024-1279
 *   • desktop ≥1280
 * Каждый режим пишет в свой @media block, значения хранятся отдельно
 * в localStorage. Панель сама подхватывает текущий диапазон по resize.
 */
export default function HeroDevPanel() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, number>>(defaultValues);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [exported, setExported] = useState<string | null>(null);
  // true когда пользователь реально что-то крутил в этом сеансе или есть stored values.
  // Пока false — панель НЕ пишет в <style>, чтобы не перекрывать @media из globals.css.
  const [dirty, setDirty] = useState(false);
  // Когда true — изменение body-* двигает hand-* и cam-* на ту же дельту,
  // body-height масштабирует hand-width и cam-width пропорционально.
  const [linkLayers, setLinkLayers] = useState(false);

  // При смене режима — подгружаем values из соответствующего localStorage.
  // applyOverrides вызываем ТОЛЬКО если в storage что-то было (т.е. ранее тюнили).
  useEffect(() => {
    if (!mode) return;
    let v = defaultValues();
    let hadStored = false;
    try {
      const raw = localStorage.getItem(MODES[mode].storageKey);
      if (raw) {
        v = { ...v, ...JSON.parse(raw) };
        hadStored = true;
      }
    } catch {}
    setValues(v);
    setDirty(hadStored);
    if (hadStored) {
      applyOverrides(mode, v);
    } else {
      // Чисто — убираем style-тег этого режима, чтобы globals.css работал как есть
      document.getElementById(MODES[mode].styleId)?.remove();
    }
  }, [mode]);

  // Detect mode на mount + при resize
  useEffect(() => {
    const check = () => setMode(detectMode());
    check();
    window.addEventListener("resize", check);
    setMounted(true);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Persist values + apply при их изменении — ТОЛЬКО если уже dirty (юзер крутил/были сохранены)
  useEffect(() => {
    if (!mounted || !mode || !dirty) return;
    applyOverrides(mode, values);
    try {
      localStorage.setItem(MODES[mode].storageKey, JSON.stringify(values));
    } catch {}
  }, [values, mounted, mode, dirty]);

  if (!mounted || !mode) return null;

  const update = (key: string, val: number) => {
    setDirty(true);
    setValues((v) => {
      const next: Record<string, number> = { ...v, [key]: val };
      if (linkLayers && key.startsWith("body-")) {
        const prev = v[key] ?? 0;
        const delta = val - prev;
        // Сдвиг по X и Y — простая дельта
        if (key === "body-right") {
          next["hand-right"] = (v["hand-right"] ?? 0) + delta;
          next["cam-right"] = (v["cam-right"] ?? 0) + delta;
        } else if (key === "body-bottom") {
          next["hand-bottom"] = (v["hand-bottom"] ?? 0) + delta;
          next["cam-bottom"] = (v["cam-bottom"] ?? 0) + delta;
        } else if (key === "body-height" && prev !== 0) {
          // Масштаб — пропорциональное изменение размеров
          const ratio = val / prev;
          next["hand-width"] = (v["hand-width"] ?? 0) * ratio;
          next["cam-width"] = (v["cam-width"] ?? 0) * ratio;
        }
      }
      return next;
    });
  };

  // Reset = убрать любые тюнинговые оверрайды, дать рулить globals.css
  const reset = () => {
    if (!mode) return;
    try {
      localStorage.removeItem(MODES[mode].storageKey);
    } catch {}
    document.getElementById(MODES[mode].styleId)?.remove();
    setValues(defaultValues());
    setDirty(false);
  };

  const exportCss = () => {
    const lines = KNOBS.map((k) => {
      const v = values[k.key] ?? k.default;
      return `    --${k.key}: ${format(k, v)};`;
    });
    const text = `${MODES[mode].mediaQuery} {\n  :root {\n${lines.join("\n")}\n  }\n}`;
    setExported(text);
    // Пробуем буфер, но не паримся если не вышло — показываем в textarea ниже
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      window.isSecureContext
    ) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  // Группировка по секциям для компактного UI
  const groups: { title: string; keys: string[] }[] = [
    { title: "Body", keys: ["body-right", "body-bottom", "body-height"] },
    { title: "Hand", keys: ["hand-right", "hand-bottom", "hand-width"] },
    { title: "Camera", keys: ["cam-right", "cam-bottom", "cam-width"] },
    {
      title: "Aura",
      keys: ["aura-right", "aura-bottom", "aura-size", "aura-opacity"],
    },
    { title: "Background", keys: ["vignette-opacity", "tint-opacity"] },
    {
      title: "Caption (001 / …)",
      keys: ["caption-x", "caption-y", "caption-scale"],
    },
    {
      title: "Name (Slava Bober)",
      keys: ["name-x", "name-y", "name-scale"],
    },
    {
      title: "Bio (описание)",
      keys: ["bio-x", "bio-y", "bio-scale", "bio-max-w"],
    },
    {
      title: "Header + Marquee",
      keys: [
        "header-pl",
        "header-pr",
        "header-py",
        "logo-h",
        "nav-size",
        "nav-gap",
        "mobile-marquee-duration",
      ],
    },
  ];

  return (
    <>
      {/* Кнопка «Tune» в нижнем правом углу — всегда видна */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed right-3 z-[101] bg-accent text-white px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase rounded-full shadow-lg hover:bg-fg transition-all font-mono ${
          open ? "bottom-[calc(48vh+12px)]" : "bottom-3"
        }`}
      >
        {open ? "Close" : "Tune"}
      </button>

      {/* Выдвижной drawer снизу */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-[100] bg-bg/95 backdrop-blur-sm border-t border-line transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "48vh" }}
      >
        <div className="h-full flex flex-col font-mono">
          {/* Header drawer'а */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-line shrink-0">
            <span className="text-[10px] tracking-[0.18em] uppercase text-fg-faint">
              Hero tuner · {MODES[mode].label}
            </span>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setLinkLayers((v) => !v)}
                className={`text-[10px] tracking-[0.12em] uppercase transition-colors ${
                  linkLayers ? "text-accent" : "text-fg-faint hover:text-fg"
                }`}
                title="Когда вкл — изменение body-* двигает hand-* и cam-* на ту же дельту"
              >
                🔗 Link {linkLayers ? "ON" : "OFF"}
              </button>
              <button
                onClick={reset}
                className="text-[10px] tracking-[0.12em] uppercase text-fg-faint hover:text-fg"
              >
                Reset
              </button>
              <button
                onClick={exportCss}
                className="text-[10px] tracking-[0.12em] uppercase text-accent hover:text-fg"
              >
                Copy CSS
              </button>
            </div>
          </div>

          {/* Содержимое — скроллится */}
          <div className="flex-1 overflow-y-auto p-3">
            {groups.map((g) => (
              <div key={g.title} className="mb-4">
                <div className="text-[10px] tracking-[0.16em] uppercase text-fg-faint/80 mb-2 pb-1 border-b border-line">
                  {g.title}
                </div>
                {g.keys.map((key) => {
                  const k = KNOBS.find((x) => x.key === key)!;
                  const v = values[key] ?? k.default;
                  return (
                    <div key={key} className="mb-2">
                      <div className="flex justify-between items-baseline mb-0.5 text-[10px]">
                        <span className="text-fg">{k.label}</span>
                        <span className="text-fg-faint">
                          {v}
                          {k.suffix}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={k.min}
                        max={k.max}
                        step={k.step}
                        value={v}
                        onChange={(e) =>
                          update(key, parseFloat(e.target.value))
                        }
                        className="w-full accent-accent"
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {exported ? (
              <div className="mt-3 mb-2 p-2 border border-accent bg-bg">
                <div className="text-[10px] tracking-[0.16em] uppercase text-accent mb-1">
                  CSS — выдели и скопируй вручную (Ctrl+A → Ctrl+C):
                </div>
                <textarea
                  readOnly
                  value={exported}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full h-40 text-[10px] font-mono text-fg bg-bg-soft p-2 border border-line"
                />
              </div>
            ) : null}

            <p className="text-[9px] tracking-[0.14em] uppercase text-fg-faint/70 mt-3 leading-relaxed">
              Изменения ограничены текущим режимом ({MODES[mode].label}). Подгонишь — Copy CSS и пришли мне.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

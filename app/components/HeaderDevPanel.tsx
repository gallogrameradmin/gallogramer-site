"use client";

import { useEffect, useState } from "react";

type Knob = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: "px" | "%";
  default: number;
};

// Минимальный набор — только три области по запросу Славы:
//   1) Логотип
//   2) Заливка Home / Portfolio / Заявка
//   3) Dark mode toggle
const KNOBS: Knob[] = [
  // ─── ЛОГОТИП ───
  { key: "logo-h", label: "Logo · height", min: 12, max: 60, step: 1, suffix: "px", default: 25 },

  // ─── HOME / PORTFOLIO / ЗАЯВКА ───
  { key: "nav-size", label: "Nav · font size", min: 6, max: 20, step: 0.5, suffix: "px", default: 9 },
  { key: "nav-gap", label: "Nav · gap", min: 2, max: 40, step: 1, suffix: "px", default: 12 },

  // ─── DARK MODE TOGGLE ───
  { key: "toggle-scale", label: "Dark · scale", min: 50, max: 200, step: 1, suffix: "%", default: 100 },
  { key: "toggle-size", label: "Dark · font size", min: 6, max: 18, step: 0.5, suffix: "px", default: 11 },
];

const STORAGE_KEY = "header-mobile-dev-knobs";
const STYLE_ID = "header-mobile-dev-overrides";

function defaultValues() {
  const v: Record<string, number> = {};
  for (const k of KNOBS) v[k.key] = k.default;
  return v;
}

function format(k: Knob, v: number): string {
  if (k.suffix === "%") return String(v / 100);
  return `${v}px`;
}

function apply(values: Record<string, number>) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  const lines = KNOBS.map((k) => {
    const v = values[k.key] ?? k.default;
    return `    --${k.key}: ${format(k, v)};`;
  });
  // Применяем только на мобильном viewport — чтобы не сломать десктоп
  style.textContent = `@media (max-width: 767px) {\n  :root {\n${lines.join("\n")}\n  }\n}`;
}

export default function HeaderDevPanel() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, number>>(defaultValues);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  useEffect(() => {
    let v = defaultValues();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) v = { ...v, ...JSON.parse(raw) };
    } catch {}
    setValues(v);
    apply(v);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    setMounted(true);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    apply(values);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {}
  }, [values, mounted]);

  if (!mounted || !isMobile) return null;

  const update = (key: string, val: number) =>
    setValues((v) => ({ ...v, [key]: val }));

  const reset = () => setValues(defaultValues());

  const exportCss = () => {
    const lines = KNOBS.map((k) => {
      const v = values[k.key] ?? k.default;
      return `    --${k.key}: ${format(k, v)};`;
    });
    const text = `@media (max-width: 767px) {\n  :root {\n${lines.join("\n")}\n  }\n}`;
    setExported(text);
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      window.isSecureContext
    ) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  // Ровно три раздела — больше ничего
  const groups: { title: string; keys: string[] }[] = [
    { title: "Logo", keys: ["logo-h"] },
    { title: "Home / Portfolio / Заявка", keys: ["nav-size", "nav-gap"] },
    { title: "Dark mode", keys: ["toggle-scale", "toggle-size"] },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed right-3 z-[101] bg-accent text-white px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase rounded-full shadow-lg hover:bg-fg transition-all font-mono ${
          open ? "bottom-[calc(50vh+12px)]" : "bottom-3"
        }`}
      >
        {open ? "Close" : "Tune header"}
      </button>

      <div
        className={`fixed left-0 right-0 bottom-0 z-[100] bg-bg/95 backdrop-blur-sm border-t border-line transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "50vh" }}
      >
        <div className="h-full flex flex-col font-mono">
          <div className="flex items-center justify-between px-3 py-2 border-b border-line shrink-0">
            <span className="text-[10px] tracking-[0.18em] uppercase text-fg-faint">
              Header tuner · mobile
            </span>
            <div className="flex gap-3">
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
                  CSS — выдели и скопируй вручную:
                </div>
                <textarea
                  readOnly
                  value={exported}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full h-32 text-[10px] font-mono text-fg bg-bg-soft p-2 border border-line"
                />
              </div>
            ) : null}

            <p className="text-[9px] tracking-[0.14em] uppercase text-fg-faint/70 mt-3 leading-relaxed">
              Только три блока: логотип, Home/Portfolio/Заявка, Dark mode.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // На первом рендере определяем тему: localStorage → системная → light
    let initial: "light" | "dark";
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null;
      if (saved === "dark" || saved === "light") {
        initial = saved;
      } else {
        initial = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
    } catch {
      initial = "dark";
    }
    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
      className="group glass inline-flex items-center gap-2 px-3 py-1.5 rounded-full tracking-[0.18em] uppercase font-mono text-fg-faint hover:text-fg transition-colors"
      style={{
        fontSize: "var(--toggle-size, 11px)",
        transform: "scale(var(--toggle-scale, 1))",
        transformOrigin: "right center",
      }}
    >
      <span
        aria-hidden
        className="relative inline-block h-[10px] w-[22px] rounded-full border border-current"
      >
        <span
          className="absolute top-[1px] left-[1px] h-[6px] w-[6px] rounded-full bg-current transition-transform duration-300"
          style={{ transform: theme === "dark" ? "translateX(0)" : "translateX(12px)" }}
        />
      </span>
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}

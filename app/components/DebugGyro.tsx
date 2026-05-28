"use client";

import { useEffect, useState } from "react";

type Status =
  | "init"
  | "not-coarse"
  | "reduced-motion"
  | "ios-need-permission"
  | "ios-permission-requested"
  | "ios-permission-denied"
  | "ios-permission-error"
  | "listening"
  | "fired";

/**
 * Временный диагностический оверлей для проблемы с гиро-параллаксом.
 * Кладётся в Hero — показывает в углу что детектится и какие данные приходят.
 * После починки — компонент и его монтаж удаляем.
 */
export default function DebugGyro() {
  const [status, setStatus] = useState<Status>("init");
  const [events, setEvents] = useState(0);
  const [last, setLast] = useState<{
    a: number | null;
    b: number | null;
    g: number | null;
  }>({ a: null, b: null, g: null });
  const [ua, setUa] = useState("");
  const [needsBtn, setNeedsBtn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUa(navigator.userAgent);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStatus("reduced-motion");
      return;
    }
    if (!window.matchMedia("(pointer: coarse)").matches) {
      setStatus("not-coarse");
      return;
    }

    const handler = (e: DeviceOrientationEvent) => {
      setEvents((n) => n + 1);
      setLast({ a: e.alpha, b: e.beta, g: e.gamma });
      setStatus("fired");
    };

    const DOE = window.DeviceOrientationEvent as unknown as
      | { requestPermission?: () => Promise<"granted" | "denied"> }
      | undefined;

    if (DOE && typeof DOE.requestPermission === "function") {
      setStatus("ios-need-permission");
      setNeedsBtn(true);
      return () => {
        window.removeEventListener("deviceorientation", handler);
      };
    }

    // Android / прочие — слушаем сразу
    window.addEventListener("deviceorientation", handler);
    setStatus("listening");
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  const requestIOS = async () => {
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    try {
      setStatus("ios-permission-requested");
      const result = await DOE.requestPermission!();
      if (result === "granted") {
        const handler = (e: DeviceOrientationEvent) => {
          setEvents((n) => n + 1);
          setLast({ a: e.alpha, b: e.beta, g: e.gamma });
          setStatus("fired");
        };
        window.addEventListener("deviceorientation", handler);
        setStatus("listening");
        setNeedsBtn(false);
      } else {
        setStatus("ios-permission-denied");
      }
    } catch {
      setStatus("ios-permission-error");
    }
  };

  return (
    <div
      className="fixed top-3 left-3 z-[200] bg-black/85 text-white text-[10px] font-mono p-3 rounded-md border border-white/20 max-w-[260px] leading-snug"
      style={{ pointerEvents: needsBtn ? "auto" : "none" }}
    >
      <div className="font-bold mb-1 text-accent">GYRO DEBUG</div>
      <div>
        status: <span className="text-yellow-300">{status}</span>
      </div>
      <div>events: {events}</div>
      <div>
        α: {fmt(last.a)} β: {fmt(last.b)} γ: {fmt(last.g)}
      </div>
      <div className="opacity-60 mt-1 break-words text-[9px]">
        UA: {ua.slice(0, 80)}
      </div>
      {needsBtn ? (
        <button
          onClick={requestIOS}
          className="mt-2 w-full bg-accent text-white py-1.5 px-2 rounded text-[10px] uppercase tracking-wider"
          style={{ pointerEvents: "auto" }}
        >
          Tap to allow motion
        </button>
      ) : null}
    </div>
  );
}

function fmt(v: number | null) {
  if (v === null || v === undefined) return "—";
  return v.toFixed(1);
}

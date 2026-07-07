"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const CONSENT_KEY = "gallogramer-cookie-consent";
export const CONSENT_ACCEPT = "accept";
export const CONSENT_REJECT = "reject";

/**
 * Ненавязчивый баннер снизу справа. Показывается пока пользователь не
 * принял и не отклонил cookie. При клике сохраняет выбор в localStorage
 * и эмитит событие «cookie-consent-changed» — YandexMetrika его слушает
 * и стартует сразу без перезагрузки.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      // Показываем только если пользователь ещё не сделал выбор
      if (stored !== CONSENT_ACCEPT && stored !== CONSENT_REJECT) {
        setVisible(true);
      }
    } catch {
      /* localStorage может быть недоступен в приватном режиме — молчим */
    }
  }, []);

  const decide = (value: typeof CONSENT_ACCEPT | typeof CONSENT_REJECT) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* ok */
    }
    window.dispatchEvent(new CustomEvent("cookie-consent-changed"));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование аналитики"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-[70] glass rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-lg"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2">
        <span className="text-accent">/</span> Cookie
      </p>
      <p className="text-sm text-fg-muted leading-relaxed mb-4">
        Сайт использует Яндекс.Метрику (включая Вебвизор — запись сеансов и
        карту кликов) для улучшения сервиса. Подробнее — в{" "}
        <Link
          href="/privacy"
          className="text-accent underline underline-offset-4 hover:no-underline"
        >
          Политике конфиденциальности
        </Link>
        .
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => decide(CONSENT_ACCEPT)}
          className="flex-1 rounded-full bg-accent text-white font-mono uppercase text-[11px] tracking-[0.14em] py-2.5 hover:bg-accent/85 transition-colors"
        >
          Принять
        </button>
        <button
          type="button"
          onClick={() => decide(CONSENT_REJECT)}
          className="flex-1 rounded-full glass font-mono uppercase text-[11px] tracking-[0.14em] py-2.5 text-fg-muted hover:text-fg transition-colors"
        >
          Отклонить
        </button>
      </div>
    </div>
  );
}

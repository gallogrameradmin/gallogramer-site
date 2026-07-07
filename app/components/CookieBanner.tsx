"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const CONSENT_KEY = "gallogramer-cookie-consent";
export const CONSENT_ACCEPT = "accept";
export const CONSENT_REJECT = "reject";

/**
 * Баннер согласия на cookie/Метрику.
 *
 * Показывается ГАРАНТИРОВАННО при первом заходе. Ключевое отличие от
 * прошлой версии — initial state = true. Раньше initial=false + useEffect
 * ставил true, если consent не найден. Проблема была в том, что на быстрой
 * навигации/медленной гидрации пользователь мог кликнуть до срабатывания
 * эффекта — и баннер визуально «пропускал» первый заход. Теперь баннер
 * рендерится сразу в HTML, а useEffect только СКРЫВАЕТ его если consent
 * уже сохранён в localStorage (то есть на повторных визитах).
 *
 * Позиция — фиксированный центр по горизонтали, низ по вертикали, на всех
 * ширинах экрана. Ширина 92vw, но не больше 480px.
 */
export default function CookieBanner() {
  // ВНИМАНИЕ: initial=true — критично для гарантии показа при первом входе.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === CONSENT_ACCEPT || stored === CONSENT_REJECT) {
        setVisible(false);
      }
    } catch {
      /* localStorage недоступен (приватный режим, отключён) —
         оставляем баннер, кнопки Принять/Отклонить всё равно отработают
         без сохранения, Метрика не запустится (что и логично). */
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
      className="!fixed bottom-4 left-1/2 -translate-x-1/2 w-[92vw] max-w-[480px] z-[70] glass rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-lg"
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

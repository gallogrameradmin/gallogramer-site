"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_KEY, CONSENT_ACCEPT } from "./CookieBanner";

const YM_ID = process.env.NEXT_PUBLIC_YM_ID ?? "";

/**
 * Загружает Яндекс.Метрику ТОЛЬКО когда пользователь дал согласие
 * (localStorage[CONSENT_KEY] === CONSENT_ACCEPT). Webvisor + clickmap
 * пишут ID сессии и клики — это уже персональные данные по ФЗ-152, поэтому
 * без явного opt-in грузить нельзя.
 *
 * Слушает событие "cookie-consent-changed" (эмитит CookieBanner при клике
 * «Принять»), чтобы Метрика запустилась сразу без перезагрузки страницы.
 */
export default function YandexMetrika() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        setEnabled(localStorage.getItem(CONSENT_KEY) === CONSENT_ACCEPT);
      } catch {
        setEnabled(false);
      }
    };
    check();
    window.addEventListener("cookie-consent-changed", check);
    return () => window.removeEventListener("cookie-consent-changed", check);
  }, []);

  if (!YM_ID || !enabled) return null;

  return (
    <>
      <Script
        id="ym-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}', 'ym');
            ym(${YM_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
          `,
        }}
      />
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${YM_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}

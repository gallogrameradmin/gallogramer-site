"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

// Привязка секций главной к пунктам навигации
const SECTION_TO_LINK: Record<string, string> = {
  hero: "/",
  services: "/#services",
  works: "/portfolio",
  contact: "/request",
};

const links = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Услуги" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/request", label: "Заявка" },
];

function LogoMark() {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      onError={() => setOk(false)}
      className="block w-auto"
      style={{
        filter: "var(--logo-filter)",
        height: "var(--logo-h, 24px)",
      }}
    />
  );
}

export default function Header() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Scroll-spy на главной — какая секция сейчас под "линией внимания"
  // (30% от верха viewport). Работает надёжнее IntersectionObserver: ему
  // мешали разные высоты секций — высокие проигрывали коротким по ratio.
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }
    const ids = Object.keys(SECTION_TO_LINK);

    const update = () => {
      let found: string | null = null;

      // Edge-case: докрутили до самого низа страницы → последняя секция
      // (когда последняя секция короче 70vh и линия до неё не дотянется).
      const scrollMax =
        document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= scrollMax - 40) {
        found = ids[ids.length - 1] ?? null;
      } else {
        const probeY = window.innerHeight * 0.3;
        // Идём в обратном порядке: если несколько секций пересекают линию
        // на границе — побеждает та, что ниже (только что вошла в кадр).
        for (let i = ids.length - 1; i >= 0; i--) {
          const id = ids[i];
          const el = document.getElementById(id);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.top <= probeY && r.bottom >= probeY) {
            found = id;
            break;
          }
        }
      }
      // Если ни одна секция не на линии — оставляем последнее значение,
      // не сбрасываем в null (иначе мигает Home).
      if (found) setActiveSection(found);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between pointer-events-none"
      style={{
        paddingLeft: "var(--header-pl, 16px)",
        paddingRight: "var(--header-pr, 16px)",
        paddingTop: "var(--header-py, 20px)",
        paddingBottom: "var(--header-py, 20px)",
      }}
    >
      <Link
        href="/"
        aria-label="gallogramer · home"
        className="pointer-events-auto inline-flex items-center gap-2 text-fg hover:text-accent transition-colors"
      >
        <LogoMark />
        <span className="hidden sm:inline text-[11px] tracking-[0.18em] uppercase font-mono">
          gallogramer
        </span>
      </Link>
      <nav
        className="pointer-events-auto flex items-center"
        style={{ gap: "var(--nav-gap, 10px)" }}
      >
        {links.map((link) => {
          // Активная ссылка:
          //   — если на /, то определяется через scroll-spy (секция в зоне видимости)
          //   — иначе по route'у
          let isActive: boolean;
          if (pathname === "/") {
            if (activeSection) {
              isActive = SECTION_TO_LINK[activeSection] === link.href;
            } else {
              // До первого скролла Home по умолчанию подсвечен
              isActive = link.href === "/";
            }
          } else {
            isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname?.startsWith(link.href) === true);
          }
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative tracking-[0.1em] sm:tracking-[0.18em] uppercase font-mono font-medium transition-colors group ${
                isActive ? "text-accent" : "text-fg-muted hover:text-fg"
              }`}
              style={{ fontSize: "var(--nav-size, 9px)" }}
            >
              {link.label} →
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-4 h-[2px] bg-accent"
                />
              )}
            </Link>
          );
        })}
        <ThemeToggle />
      </nav>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

// Привязка секций главной к пунктам навигации
const SECTION_TO_LINK: Record<string, string> = {
  hero: "/",
  works: "/portfolio",
  contact: "/request",
};

const links = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/services", label: "Услуги" },
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

  // Scroll-spy на главной — отслеживает какая секция в зоне видимости.
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }
    const ids = Object.keys(SECTION_TO_LINK);
    const observer = new IntersectionObserver(
      (entries) => {
        // Выбираем секцию с наибольшим intersection ratio из видимых
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        // Зона срабатывания — средняя треть экрана
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );
    const elements: Element[] = [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        elements.push(el);
      }
    }
    return () => observer.disconnect();
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
                  className="absolute -bottom-1 left-0 right-4 h-[1px] bg-accent"
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

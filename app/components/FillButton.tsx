"use client";

import Link from "next/link";
import { useRef, type CSSProperties, type ReactNode } from "react";

type Common = {
  children: ReactNode;
  className?: string;
};

const baseClass =
  "group relative inline-flex items-center justify-between gap-4 glass text-fg font-mono uppercase tracking-[0.14em] text-sm md:text-base px-7 md:px-8 py-4 md:py-5 rounded-full active:scale-[0.98] hover:text-white overflow-hidden";

/**
 * Кнопка с радиальной заливкой фиолетовым из точки, где курсор входит в кнопку.
 * При каждом hover точка старта своя — каждое нажатие ощущается уникально.
 */
function FillEffect() {
  return (
    <span
      aria-hidden
      className="absolute aspect-square w-0 group-hover:w-[260%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/75 backdrop-blur-sm transition-[width] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
      style={{ top: "var(--oy, 50%)", left: "var(--ox, 50%)" }}
    />
  );
}

function applyOrigin(
  el: HTMLElement,
  e: { clientX: number; clientY: number },
) {
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  el.style.setProperty("--ox", `${x}%`);
  el.style.setProperty("--oy", `${y}%`);
}

export function FillLink({
  href,
  external,
  children,
  className,
}: Common & { href: string; external?: boolean }) {
  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) =>
    applyOrigin(e.currentTarget, e);

  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" as const }
    : {};

  if (external) {
    return (
      <a
        href={href}
        {...linkProps}
        onMouseEnter={handleEnter}
        className={`${baseClass} ${className ?? ""}`}
      >
        <FillEffect />
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      onMouseEnter={handleEnter}
      className={`${baseClass} ${className ?? ""}`}
    >
      <FillEffect />
      {children}
    </Link>
  );
}

type FillSubmitProps = Common & {
  disabled?: boolean;
  type?: "submit" | "button";
};

export function FillSubmit({
  children,
  className,
  disabled,
  type = "submit",
}: FillSubmitProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) =>
    applyOrigin(e.currentTarget, e);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onMouseEnter={handleEnter}
      className={`group relative inline-flex items-center justify-center gap-3 glass text-fg font-mono uppercase tracking-[0.14em] text-sm px-8 py-4 rounded-full hover:text-white active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden ${className ?? ""}`}
    >
      {!disabled ? <FillEffect /> : null}
      {children}
    </button>
  );
}

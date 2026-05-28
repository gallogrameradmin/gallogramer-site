/**
 * Регистрационные метки в углах секции — отсылка к плёночному кадру и полиграфии.
 * Каждый угол: маленький `+` крест + опциональный моно-код.
 * Кладётся в parent с position: relative.
 */
export default function EdgeMarks({
  code,
  label,
}: {
  /** Код типа "002/A" — печатается в верхне-левом углу */
  code?: string;
  /** Лейбл типа "SERVICES" — в нижне-правом углу */
  label?: string;
}) {
  return (
    <>
      {/* Top-left: + + код */}
      <div className="absolute top-4 md:top-6 left-4 md:left-6 pointer-events-none flex items-center gap-3 text-[9px] tracking-[0.2em] font-mono uppercase text-fg-faint/60">
        <CrossMark />
        {code ? <span>{code}</span> : null}
      </div>

      {/* Top-right: одинокий + */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 pointer-events-none">
        <CrossMark />
      </div>

      {/* Bottom-left: одинокий + */}
      <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 pointer-events-none">
        <CrossMark />
      </div>

      {/* Bottom-right: лейбл + + */}
      <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 pointer-events-none flex items-center gap-3 text-[9px] tracking-[0.2em] font-mono uppercase text-fg-faint/60">
        {label ? <span>{label}</span> : null}
        <CrossMark />
      </div>
    </>
  );
}

function CrossMark({ size = 10 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      className="text-accent/60"
      aria-hidden
    >
      <line
        x1="5"
        y1="0.5"
        x2="5"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="0.5"
        y1="5"
        x2="9.5"
        y2="5"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

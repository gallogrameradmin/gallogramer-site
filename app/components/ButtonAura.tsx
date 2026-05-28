/**
 * Большой мягкий фиолетовый круг (как аура за Славой в Hero).
 * Кладётся под группу glass-кнопок чтобы они «светились» сквозь стекло.
 * Использовать в parent с `position: relative isolate` чтобы он не вылезал
 * за пределы группы.
 */
export default function ButtonAura({
  className = "",
  opacity = 0.55,
  blur = 50,
  shape = "circle",
}: {
  className?: string;
  opacity?: number;
  /** Размытие в px. По дефолту 50, для бóльших мягких аур — 70-90. */
  blur?: number;
  /** Форма ауры: "circle" — круг, "ellipse" — овал (тянется по ширине контейнера). */
  shape?: "circle" | "ellipse";
}) {
  return (
    <div
      aria-hidden
      className={`absolute pointer-events-none -z-10 ${className}`}
      style={{
        background: `radial-gradient(${shape} at center, var(--accent) 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity,
      }}
    />
  );
}

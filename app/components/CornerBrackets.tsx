/**
 * Четыре уголковые скобки `┌ ┐ └ ┘` фиолетового цвета — появляются при hover
 * с лёгким inward slide. Отсылка к видеокамере / видоискателю / печатным меткам.
 */
export default function CornerBrackets({
  size = 14,
  thickness = 1,
  offset = 6,
}: {
  size?: number;
  thickness?: number;
  offset?: number;
}) {
  const common =
    "absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out text-accent";
  return (
    <>
      <span
        aria-hidden
        className={common}
        style={{
          top: offset,
          left: offset,
          width: size,
          height: size,
          borderTop: `${thickness}px solid currentColor`,
          borderLeft: `${thickness}px solid currentColor`,
        }}
      />
      <span
        aria-hidden
        className={common}
        style={{
          top: offset,
          right: offset,
          width: size,
          height: size,
          borderTop: `${thickness}px solid currentColor`,
          borderRight: `${thickness}px solid currentColor`,
        }}
      />
      <span
        aria-hidden
        className={common}
        style={{
          bottom: offset,
          left: offset,
          width: size,
          height: size,
          borderBottom: `${thickness}px solid currentColor`,
          borderLeft: `${thickness}px solid currentColor`,
        }}
      />
      <span
        aria-hidden
        className={common}
        style={{
          bottom: offset,
          right: offset,
          width: size,
          height: size,
          borderBottom: `${thickness}px solid currentColor`,
          borderRight: `${thickness}px solid currentColor`,
        }}
      />
    </>
  );
}

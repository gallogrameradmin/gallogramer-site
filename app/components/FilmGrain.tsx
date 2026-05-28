/**
 * Шумовая текстура на весь сайт — придаёт шершавость, как у плёнки или
 * крафтовой бумаги. Двухслойный шум: мелкое зерно + чуть более крупное,
 * чтобы текстура читалась на разном расстоянии и не сливалась с фоном.
 */
export default function FilmGrain() {
  return (
    <>
      {/* Мелкое зерно — основной слой */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] mix-blend-overlay opacity-[0.18]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.3 -0.25'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      {/* Крупное зерно — шершавость, чувствуется как наждачка */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] mix-blend-soft-light opacity-[0.22]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 -0.3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </>
  );
}

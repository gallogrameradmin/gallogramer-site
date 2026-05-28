/**
 * «Забытая нитка» — тонкая горизонтальная фиолетовая линия фоном.
 * Никаких интеракций, лёгкий перекос на пол-градуса для ощущения «случайной».
 */
export default function AmbientLine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute left-[-2vw] right-[-2vw] h-px bg-accent/35"
        style={{
          top: "38vh",
          transform: "rotate(-0.4deg)",
        }}
      />
    </div>
  );
}

type MarqueeProps = {
  items: string[];
  speed?: number;
  reverse?: boolean;
  className?: string;
};

export default function Marquee({
  items,
  speed = 40,
  reverse = false,
  className = "",
}: MarqueeProps) {
  const doubled = [...items, ...items];

  return (
    <div
      className={`relative w-full overflow-hidden border-y border-line ${className}`}
    >
      <div
        className="marquee-track flex whitespace-nowrap py-5 md:py-7 will-change-transform"
        style={
          {
            ["--marquee-duration"]: `${speed}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-display text-[clamp(1.5rem,3.5vw,3rem)] font-medium tracking-[-0.02em] px-6 md:px-10 flex items-center gap-6 md:gap-10"
          >
            {item}
            <span
              aria-hidden
              className="inline-block h-[6px] w-[6px] rounded-full bg-accent shrink-0"
            />
          </span>
        ))}
      </div>
    </div>
  );
}

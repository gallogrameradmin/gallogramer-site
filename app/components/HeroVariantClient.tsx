"use client";

import dynamic from "next/dynamic";
import HeroContent from "./HeroContent";
import HeroCinema from "./hero-variants/HeroCinema";
import HeroSculpture from "./hero-variants/HeroSculpture";
import { useHeroVariant } from "./HeroVariantSwitcher";

const HeroWebGL = dynamic(() => import("./hero-variants/HeroWebGL"), {
  ssr: false,
  loading: () => (
    <section className="relative min-h-[100svh] flex items-center justify-center">
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-faint">
        Loading WebGL…
      </div>
    </section>
  ),
});

type Props = {
  mode: "portrait" | "reach";
  portrait: string | null;
  reachBody: string | null;
  hand: string | null;
  camera: string | null;
  bio: string;
};

export default function HeroVariantClient(props: Props) {
  const variant = useHeroVariant();

  switch (variant) {
    case "cinema":
      return <HeroCinema {...props} />;
    case "sculpture":
      return <HeroSculpture {...props} />;
    case "webgl":
      return <HeroWebGL {...props} />;
    case "baseline":
    default:
      return <HeroContent {...props} />;
  }
}

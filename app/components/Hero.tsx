import { existsSync } from "node:fs";
import { join } from "node:path";
import HeroVariantClient from "./HeroVariantClient";
import { getContent } from "../lib/content-source";

function findFirst(root: string, names: string[]) {
  for (const name of names) {
    if (existsSync(join(root, "public", name))) {
      return `/${name}`;
    }
  }
  return null;
}

export default async function Hero() {
  const root = process.cwd();
  const content = await getContent();

  const reachBody = findFirst(root, [
    "me-reach.png",
    "me-reach.webp",
    "me-reach.jpg",
    "me-reach.jpeg",
    "me-reach-placeholder.svg",
  ]);
  const hand = findFirst(root, [
    "hand.png",
    "hand.webp",
    "hand.jpg",
    "hand.jpeg",
    "hand-placeholder.svg",
  ]);
  const camera = findFirst(root, [
    "camera.png",
    "camera.webp",
    "camera.jpg",
    "camera-placeholder.svg",
  ]);

  const portrait = findFirst(root, [
    "me.png",
    "me.webp",
    "me.jpg",
    "me.jpeg",
    "me-placeholder.jpg",
  ]);

  const isReachMode = !!reachBody && !!camera;

  return (
    <HeroVariantClient
      mode={isReachMode ? "reach" : "portrait"}
      portrait={portrait}
      reachBody={reachBody}
      hand={hand}
      camera={camera}
      bio={content.hero.bio}
    />
  );
}

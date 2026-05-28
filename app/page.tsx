import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Featured from "./components/Featured";
import Services from "./components/Services";
import Footer from "./components/Footer";
import { getPhotos } from "./lib/photos-source";
import { getContent } from "./lib/content-source";

// Перепроверять манифест и контент на YC Object Storage каждые 60 секунд
export const revalidate = 60;

export default async function Home() {
  const [photos, content] = await Promise.all([getPhotos(), getContent()]);
  return (
    <main>
      <Hero />
      <Marquee
        items={["Brutalism", "Photo", "Video", "Cinema", "Portrait"]}
        speed={50}
      />
      <Services photos={photos} services={content.services} />
      <Featured photos={photos} />
      <Footer />
    </main>
  );
}

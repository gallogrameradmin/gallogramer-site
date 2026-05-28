import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Featured from "./components/Featured";
import Services from "./components/Services";
import Footer from "./components/Footer";
import { getPhotos } from "./lib/photos-source";

// Перепроверять манифест на YC Object Storage каждые 60 секунд
export const revalidate = 60;

export default async function Home() {
  const photos = await getPhotos();
  return (
    <main>
      <Hero />
      <Marquee
        items={["Brutalism", "Photo", "Video", "Cinema", "Portrait"]}
        speed={50}
      />
      <Services photos={photos} />
      <Featured photos={photos} />
      <Footer />
    </main>
  );
}

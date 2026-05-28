import type { Metadata } from "next";
import PortfolioGrid from "../components/PortfolioGrid";
import Footer from "../components/Footer";
import { getPhotos, getVideos } from "../lib/photos-source";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Архив работ — фотография и видео в стиле брутализм.",
};

// Перепроверять манифесты каждые 60 секунд
export const revalidate = 60;

export default async function PortfolioPage() {
  const [photos, videos] = await Promise.all([getPhotos(), getVideos()]);
  return (
    <main>
      <PortfolioGrid photos={photos} videos={videos} />
      <Footer />
    </main>
  );
}

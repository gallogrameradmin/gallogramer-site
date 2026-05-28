import type { Metadata } from "next";
import PortfolioGrid from "../components/PortfolioGrid";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Архив работ — фотография и видео в стиле брутализм.",
};

export default function PortfolioPage() {
  return (
    <main>
      <PortfolioGrid />
      <Footer />
    </main>
  );
}

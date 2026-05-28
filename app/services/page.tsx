import type { Metadata } from "next";
import ServicesGrid from "../components/ServicesGrid";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Услуги",
  description:
    "Фото и видео под задачу — репортаж, портрет, лукбук, интервью, backstage.",
};

export default function ServicesPage() {
  return (
    <main>
      <ServicesGrid />
      <Footer />
    </main>
  );
}

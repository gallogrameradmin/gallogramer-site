import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Featured from "./components/Featured";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Marquee
        items={["Brutalism", "Photo", "Video", "Cinema", "Portrait"]}
        speed={50}
      />
      <Featured />
      <Footer />
    </main>
  );
}

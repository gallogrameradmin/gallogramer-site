import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import HeroDevPanel from "./components/HeroDevPanel";
import FilmGrain from "./components/FilmGrain";
import AmbientLine from "./components/AmbientLine";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  // Space Grotesk не имеет cyrillic glyphs — оставляем только latin.
  // Для русских заголовков Inter (sans) подхватит как fallback.
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gallogramer.com"),
  title: {
    default: "gallogramer — Slava Bober",
    template: "%s · gallogramer",
  },
  description:
    "Slava Bober — фотограф и видеограф. Брутализм, событийная и репортажная съёмка.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "gallogramer",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-bg text-fg font-sans min-h-screen overflow-x-hidden">
        <AmbientLine />
        <FilmGrain />
        <Header />
        {children}
        <HeroDevPanel />
      </body>
    </html>
  );
}

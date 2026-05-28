import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.yandexcloud.net",
        pathname: "/gallogramer-photos/**",
      },
      {
        protocol: "https",
        hostname: "storage.yandexcloud.net",
        pathname: "/gallogramer-videos/**",
      },
    ],
  },
  // Прокси медиа через свой домен → попадает в YC CDN-кэш на российских эджах.
  // Без этого видео идут напрямую из Object Storage без CDN, и буферизация дикая.
  async rewrites() {
    return [
      {
        source: "/media/photos/:key*",
        destination:
          "https://storage.yandexcloud.net/gallogramer-photos/:key*",
      },
      {
        source: "/media/videos/:key*",
        destination:
          "https://storage.yandexcloud.net/gallogramer-videos/:key*",
      },
    ];
  },
};

export default nextConfig;

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
};

export default nextConfig;

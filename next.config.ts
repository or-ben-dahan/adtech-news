import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/adtech-news",
  assetPrefix: "/adtech-news/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

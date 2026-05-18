import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/basketball-card-game',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

const nextConfig: NextConfig = {
  output: 'export',
  ...(isGitHubPages ? { basePath: '/basketball-card-game' } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

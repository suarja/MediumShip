import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["convex"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;

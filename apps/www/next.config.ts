import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["convex"],
  experimental: {
    externalDir: true,
  },
  // Monorepo: the landing imports `convex/` at repo root; silences wrong
  // workspace-root detection on Vercel.
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;

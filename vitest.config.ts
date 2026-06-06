import { defineConfig } from "vitest/config";

// Convex backend tests only. The mobile/UI suite stays on Jest (jest-expo);
// `convex-test` needs Node APIs (node:async_hooks) and the Convex runtime, so it
// runs under Vitest with the `node` environment — mirroring the proven
// `../editia/web` setup. Scope is restricted to `convex/**/*.test.ts` so the two
// runners never pick up each other's files.
export default defineConfig({
  test: {
    environment: "node",
    include: ["convex/**/*.test.ts"],
  },
});

/// <reference types="vite/client" />

/**
 * Module map for `convex-test`. Lives outside `convex/` so the Convex
 * deploy/typecheck never sees it. Vite (via Vitest) resolves the glob; the test
 * files themselves are excluded so they are not loaded as functions.
 */
export const modules = import.meta.glob(
  ["./convex/**/*.ts", "!./convex/**/*.test.ts"],
  {},
);

/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregateTest from "@convex-dev/aggregate/test";
import type { GenericSchema, SchemaDefinition } from "convex/server";
import type { TestConvex } from "convex-test";

import schema from "./convex/schema";
import { modules } from "./convexTestModules";

/**
 * Creates a convexTest instance with all required components registered.
 * Use this instead of `convexTest(schema, modules)` in test files that exercise
 * mutations that write to the `contents` table (which syncs to the
 * contentCategoryCounts aggregate).
 */
export function makeConvexTest(): TestConvex<
  SchemaDefinition<GenericSchema, boolean>
> {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "contentCategoryCounts");
  return t;
}

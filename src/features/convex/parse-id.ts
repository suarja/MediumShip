import type { Id, TableNames } from "../../../convex/_generated/dataModel";

/**
 * Returns `value` when it plausibly matches a Convex document id, otherwise null.
 * Prevents `ArgumentValidationError` when route params carry mock/slug ids
 * (e.g. `evt-1` from Jest fixtures or stale smoke-test URLs).
 */
export function tryParseConvexId<TableName extends TableNames>(
  value: string | undefined,
): Id<TableName> | null {
  if (!value) {
    return null;
  }

  // Real Convex ids are opaque base64url strings (typically ~32 chars).
  if (value.length < 20 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  return value as Id<TableName>;
}

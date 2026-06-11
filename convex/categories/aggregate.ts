import { TableAggregate } from "@convex-dev/aggregate";

import { components } from "../_generated/api";
import type { DataModel, Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Aggregate for published content category counts.
 *
 * Sort key: [tenantSlug, status, category]
 *
 * This allows O(log n) queries such as:
 *   - count all published for a tenant: prefix [tenantSlug, "published"]
 *   - count by category:               prefix [tenantSlug, "published", category]
 */
export const contentCategoryCounts = new TableAggregate<{
  Key: [string, string, string];
  DataModel: DataModel;
  TableName: "contents";
}>(components.contentCategoryCounts, {
  sortKey: (doc: Doc<"contents">) => [doc.tenantSlug, doc.status, doc.category],
});

// ─── Write-path helpers ────────────────────────────────────────────────────────

/** Call after ctx.db.insert("contents", ...) — pass the inserted doc. */
export async function syncContentInsert(
  ctx: MutationCtx,
  doc: Doc<"contents">,
): Promise<void> {
  await contentCategoryCounts.insert(ctx, doc);
}

/**
 * Call around a ctx.db.patch / ctx.db.replace on "contents".
 * Read the old doc BEFORE the write, pass both old and new to this helper.
 */
export async function syncContentUpdate(
  ctx: MutationCtx,
  oldDoc: Doc<"contents">,
  newDoc: Doc<"contents">,
): Promise<void> {
  await contentCategoryCounts.replace(ctx, oldDoc, newDoc);
}

/** Call before or after ctx.db.delete on "contents" — pass the doc that was deleted. */
export async function syncContentDelete(
  ctx: MutationCtx,
  doc: Doc<"contents">,
): Promise<void> {
  await contentCategoryCounts.delete(ctx, doc);
}

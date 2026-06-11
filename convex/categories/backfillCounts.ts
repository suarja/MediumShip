import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { contentCategoryCounts } from "./aggregate";

const BATCH_SIZE = 100;

/**
 * One-shot paginated backfill for contentCategoryCounts aggregate.
 *
 * Idempotent: clears the aggregate entirely on the first page (cursor === null),
 * then inserts every "contents" document page by page, self-rescheduling until
 * done. Safe to run multiple times — each full run resets and rebuilds.
 *
 * Invoke via Convex MCP or dashboard:
 *   internal.categories.backfillCounts.backfillContentCategoryCounts
 * with args: {}  (starts from the beginning)
 */
export const backfillContentCategoryCounts = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.object({ done: v.boolean(), processed: v.number() }),
  handler: async (ctx, { cursor }) => {
    // On the first page, clear the aggregate so we start fresh (idempotent).
    if (cursor === undefined || cursor === null) {
      await contentCategoryCounts.clear(ctx);
    }

    const result = await ctx.db.query("contents").paginate({
      numItems: BATCH_SIZE,
      cursor: cursor ?? null,
    });

    for (const doc of result.page) {
      await contentCategoryCounts.insertIfDoesNotExist(ctx, doc);
    }

    if (!result.isDone) {
      // Self-reschedule to continue with the next page.
      await ctx.scheduler.runAfter(
        0,
        internal.categories.backfillCounts.backfillContentCategoryCounts,
        { cursor: result.continueCursor },
      );
    }

    return { done: result.isDone, processed: result.page.length };
  },
});

/**
 * Daily reconciliation: recount every published content row and fix any drift
 * in the aggregate. Designed to run once per day via cron as a safety net.
 *
 * Uses the same paginated pattern so it stays within transaction limits.
 */
export const reconcileContentCategoryCounts = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.object({ done: v.boolean(), processed: v.number() }),
  handler: async (ctx, { cursor }) => {
    // On the first page, clear and rebuild.
    if (cursor === undefined || cursor === null) {
      await contentCategoryCounts.clear(ctx);
    }

    const result = await ctx.db.query("contents").paginate({
      numItems: BATCH_SIZE,
      cursor: cursor ?? null,
    });

    for (const doc of result.page) {
      await contentCategoryCounts.insertIfDoesNotExist(ctx, doc);
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.categories.backfillCounts.reconcileContentCategoryCounts,
        { cursor: result.continueCursor },
      );
    }

    return { done: result.isDone, processed: result.page.length };
  },
});

import { v } from "convex/values";

import { internalMutation } from "../_generated/server";

const ingestedContentValidator = v.object({
  tenantSlug: v.string(),
  kind: v.union(
    v.literal("article"),
    v.literal("episode"),
    v.literal("video"),
  ),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("archived"),
  ),
  slug: v.string(),
  title: v.string(),
  summary: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  isPremium: v.boolean(),
  heroImageUrl: v.optional(v.string()),
  publishedAt: v.optional(v.string()),
  source: v.union(v.literal("cms"), v.literal("wikipedia")),
  externalId: v.string(),
  canonicalUrl: v.string(),
});

export const upsertIngested = internalMutation({
  args: {
    items: v.array(ingestedContentValidator),
  },
  returns: v.object({ upserted: v.number() }),
  handler: async (ctx, { items }) => {
    let upserted = 0;

    for (const item of items) {
      const existing = await ctx.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q
            .eq("tenantSlug", item.tenantSlug)
            .eq("source", item.source)
            .eq("externalId", item.externalId),
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("contents", item);
        upserted += 1;
      }
    }

    return { upserted };
  },
});

import { v } from "convex/values";

import { query } from "../_generated/server";
import { toCollectionItem, toCollectionSummary } from "./model";

export const listPublishedCollections = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .collect();

    return Promise.all(
      collections.map(async (coll) => {
        const items = await ctx.db
          .query("collectionItems")
          .withIndex("by_collection_and_order", (q) =>
            q.eq("collectionId", coll._id),
          )
          .collect();
        return toCollectionSummary(coll, items.length);
      }),
    );
  },
});

/**
 * Published content of a collection identified by slug, in collection order.
 * Returns raw content docs (like listPublishedFeed) so callers can map them with
 * the shared content-card selectors. Empty array when the collection is missing
 * or unpublished — lets the onboarding carousel fall back to the general feed.
 */
export const getCollectionContentsBySlug = query({
  args: { tenantSlug: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    const coll = await ctx.db
      .query("collections")
      .withIndex("by_tenantSlug_and_slug", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("slug", args.slug),
      )
      .unique();
    if (!coll || coll.status !== "published") {
      return [];
    }

    const collectionItems = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_and_order", (q) => q.eq("collectionId", coll._id))
      .order("asc")
      .collect();

    const contents = await Promise.all(
      collectionItems.map((ci) => ctx.db.get(ci.contentId)),
    );

    return contents.filter(
      (content): content is NonNullable<typeof content> =>
        content !== null && content.status === "published",
    );
  },
});

export const getPublishedCollectionById = query({
  args: { id: v.id("collections") },
  handler: async (ctx, args) => {
    const coll = await ctx.db.get(args.id);
    if (!coll || coll.status !== "published") return null;

    const collectionItems = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_and_order", (q) =>
        q.eq("collectionId", args.id),
      )
      .order("asc")
      .collect();

    const items = await Promise.all(
      collectionItems.map(async (ci) => {
        const content = await ctx.db.get(ci.contentId);
        if (!content || content.status !== "published") return null;
        return toCollectionItem(content);
      }),
    );

    const publishedItems = items.filter((item) => item !== null);

    return {
      ...toCollectionSummary(coll, publishedItems.length),
      items: publishedItems,
    };
  },
});

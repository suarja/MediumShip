import { v } from "convex/values";

import { query } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { bucketFeed, type FeedReason } from "./scoring";
import { isContentVisible } from "./visibility";

const DEFAULT_LIMIT = 20;
const GUEST_FEED_MIX = { editorial: 0.5, random: 0.5 } as const;

export type DiscoveryFeedItem = Doc<"contents"> & {
  reason: FeedReason;
};

function recencyScore(content: Doc<"contents">): number {
  return content.publishedAt ? Date.parse(content.publishedAt) : 0;
}

export const getDiscoveryFeed = query({
  args: {
    tenantSlug: v.string(),
    tokenIdentifier: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("contents"),
      _creationTime: v.number(),
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
      readingTimeMinutes: v.optional(v.number()),
      articleBody: v.optional(v.string()),
      audioUrl: v.optional(v.string()),
      durationSeconds: v.optional(v.number()),
      videoSource: v.optional(
        v.union(
          v.object({
            kind: v.literal("youtube"),
            youtubeVideoId: v.string(),
            youtubeUrl: v.string(),
          }),
          v.object({
            kind: v.literal("hosted"),
            uploadKey: v.string(),
            playbackUrl: v.string(),
          }),
        ),
      ),
      reason: v.union(
        v.literal("personalized"),
        v.literal("archive"),
        v.literal("editorial"),
        v.literal("random"),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    void args.tokenIdentifier;

    const limit = args.limit ?? DEFAULT_LIMIT;

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();

    const enabledModules = tenant?.enabledModules ?? [];

    const published = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .collect();

    const visible = published.filter((content) =>
      isContentVisible(content, enabledModules),
    );

    const scored = visible.map((content) => ({
      id: content._id,
      content,
      score: recencyScore(content),
    }));

    const mixed = bucketFeed(scored, GUEST_FEED_MIX).slice(0, limit);

    return mixed.map((item) => ({
      ...item.content,
      reason: item.reason,
    }));
  },
});

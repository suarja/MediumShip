import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { requireMember } from "../entitlements/authz";

export const saveMyPlaybackProgress = mutation({
  args: {
    contentId: v.id("contents"),
    seconds: v.number(),
  },
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    const existing = await ctx.db
      .query("playbackProgress")
      .withIndex("by_tokenIdentifier_and_contentId", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier).eq("contentId", args.contentId),
      )
      .unique();

    const patch = {
      tokenIdentifier: entitlement.tokenIdentifier,
      contentId: args.contentId,
      seconds: Math.max(0, Math.floor(args.seconds)),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return;
    }

    await ctx.db.insert("playbackProgress", patch);
  },
});

export const clearMyPlaybackProgress = mutation({
  args: {
    contentId: v.id("contents"),
  },
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    const existing = await ctx.db
      .query("playbackProgress")
      .withIndex("by_tokenIdentifier_and_contentId", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier).eq("contentId", args.contentId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

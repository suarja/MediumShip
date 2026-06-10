import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { requireMember } from "../entitlements/authz";
import { mergeStoredPlaybackDuration } from "./resume";

export const saveMyPlaybackProgress = mutation({
  args: {
    contentId: v.id("contents"),
    seconds: v.number(),
    durationSeconds: v.optional(v.number()),
    durationFromPlayer: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    const existing = await ctx.db
      .query("playbackProgress")
      .withIndex("by_tokenIdentifier_and_contentId", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier).eq("contentId", args.contentId),
      )
      .unique();

    const flooredSeconds = Math.max(0, Math.floor(args.seconds));
    const durationSeconds = mergeStoredPlaybackDuration(
      existing?.durationSeconds,
      args.durationSeconds,
      args.durationFromPlayer ?? false,
    );

    const patch = {
      tokenIdentifier: entitlement.tokenIdentifier,
      contentId: args.contentId,
      seconds: flooredSeconds,
      updatedAt: Date.now(),
      ...(durationSeconds !== undefined && durationSeconds > 0
        ? { durationSeconds }
        : {}),
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

import { v } from "convex/values";

import { query } from "../_generated/server";
import { requireMember } from "../entitlements/authz";

export const getMyPlaybackProgress = query({
  args: { contentId: v.id("contents") },
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);

    const progress = await ctx.db
      .query("playbackProgress")
      .withIndex("by_tokenIdentifier_and_contentId", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier).eq("contentId", args.contentId),
      )
      .unique();

    if (!progress) {
      return null;
    }

    return {
      seconds: progress.seconds,
      durationSeconds: progress.durationSeconds,
      updatedAt: progress.updatedAt,
    };
  },
});

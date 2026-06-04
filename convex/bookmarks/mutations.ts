import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { requireMember } from "../entitlements/authz";
import { resolveToggleBookmark } from "./model";

export const toggleBookmark = mutation({
  args: { contentId: v.id("contents") },
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    const content = await ctx.db.get(args.contentId);

    if (!content || content.status !== "published") {
      throw new Error("Content not found");
    }

    const existingBookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_tokenIdentifier_and_contentId", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier).eq("contentId", args.contentId),
      )
      .unique();

    const decision = resolveToggleBookmark(
      existingBookmark ? { _id: existingBookmark._id } : null,
    );

    if (decision === "delete" && existingBookmark) {
      await ctx.db.delete(existingBookmark._id);
      return { bookmarked: false };
    }

    await ctx.db.insert("bookmarks", {
      tokenIdentifier: entitlement.tokenIdentifier,
      contentId: args.contentId,
      createdAt: Date.now(),
    });

    return { bookmarked: true };
  },
});

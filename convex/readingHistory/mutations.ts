import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { requireMember } from "../entitlements/authz";

export const clearReadingHistory = mutation({
  args: {},
  returns: v.object({ clearedAt: v.number() }),
  handler: async (ctx) => {
    const entitlement = await requireMember(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("readingHistoryState")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { clearedAt: now });
      return { clearedAt: now };
    }

    await ctx.db.insert("readingHistoryState", {
      tokenIdentifier: entitlement.tokenIdentifier,
      clearedAt: now,
    });

    return { clearedAt: now };
  },
});

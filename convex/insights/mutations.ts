import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { requireMember } from "../entitlements/authz";

export const markAnalysisSeen = mutation({
  args: {
    analysisId: v.id("tasteAnalysis"),
    seenAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    const analysis = await ctx.db.get(args.analysisId);

    if (!analysis || analysis.tokenIdentifier !== entitlement.tokenIdentifier) {
      throw new Error("Analysis not found");
    }

    if (analysis.seenAt !== undefined) {
      return null;
    }

    await ctx.db.patch(args.analysisId, {
      seenAt: args.seenAt ?? Date.now(),
    });

    return null;
  },
});

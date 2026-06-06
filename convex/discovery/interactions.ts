import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { applyInteraction, type Affinity } from "./scoring";

const VIEW_DEBOUNCE_MS = 60_000;

const interactionType = v.union(
  v.literal("view"),
  v.literal("open"),
  v.literal("skip"),
  v.literal("like"),
  v.literal("finish"),
  v.literal("share"),
  v.literal("hide"),
);

export const recordInteraction = mutation({
  args: {
    tenantSlug: v.string(),
    contentId: v.id("contents"),
    type: interactionType,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const content = await ctx.db.get(args.contentId);
    if (!content || content.status !== "published") {
      return null;
    }

    if (args.type === "view") {
      const existing = await ctx.db
        .query("contentInteractions")
        .withIndex("by_tokenIdentifier_and_contentId", (q) =>
          q
            .eq("tokenIdentifier", identity.tokenIdentifier)
            .eq("contentId", args.contentId),
        )
        .collect();

      const now = Date.now();
      const recentView = existing.find(
        (row) => row.type === "view" && now - row.createdAt < VIEW_DEBOUNCE_MS,
      );

      if (recentView) {
        return null;
      }
    }

    const now = Date.now();

    await ctx.db.insert("contentInteractions", {
      tokenIdentifier: identity.tokenIdentifier,
      tenantSlug: args.tenantSlug,
      contentId: args.contentId,
      type: args.type,
      createdAt: now,
    });

    const existingPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .collect();

    const affinities: Affinity[] = existingPrefs.map((pref) => ({
      targetType: pref.targetType,
      targetId: pref.targetId,
      score: pref.score,
    }));

    const updated = applyInteraction(affinities, {
      type: args.type,
      category: content.category,
      tags: content.tags,
      kind: content.kind,
    });

    const existingByKey = new Map(
      existingPrefs.map((pref) => [
        `${pref.targetType}/${pref.targetId}`,
        pref,
      ]),
    );

    for (const pref of updated) {
      const key = `${pref.targetType}/${pref.targetId}`;
      const existing = existingByKey.get(key);

      if (existing) {
        if (existing.score !== pref.score) {
          await ctx.db.patch(existing._id, {
            score: pref.score,
            updatedAt: now,
          });
        }
        continue;
      }

      await ctx.db.insert("userPreferences", {
        tokenIdentifier: identity.tokenIdentifier,
        tenantSlug: args.tenantSlug,
        targetType: pref.targetType,
        targetId: pref.targetId,
        score: pref.score,
        updatedAt: now,
      });
    }

    return null;
  },
});

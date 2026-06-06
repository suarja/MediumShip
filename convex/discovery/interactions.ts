import { v } from "convex/values";

import { mutation, type MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { projectAffinities, type ProjectableSignal } from "./scoring";

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

/**
 * Recompute the member's affinity profile as a pure projection of their current
 * interaction set, then sync `userPreferences` to match (upsert present keys,
 * delete keys that no longer have a contributor — e.g. a toggled-off like).
 * Idempotent by construction: replaying the same interaction set is a no-op.
 */
async function syncAffinities(
  ctx: MutationCtx,
  tokenIdentifier: string,
  tenantSlug: string,
  now: number,
): Promise<void> {
  const interactions = await ctx.db
    .query("contentInteractions")
    .withIndex("by_tokenIdentifier_and_contentId", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .collect();

  const contentCache = new Map<string, Doc<"contents"> | null>();
  const signals: ProjectableSignal[] = [];

  for (const interaction of interactions) {
    let content = contentCache.get(interaction.contentId);
    if (content === undefined) {
      content = await ctx.db.get(interaction.contentId);
      contentCache.set(interaction.contentId, content);
    }
    if (!content) {
      continue;
    }

    signals.push({
      contentId: interaction.contentId,
      type: interaction.type,
      category: content.category,
      tags: content.tags,
      kind: content.kind,
    });
  }

  const desired = projectAffinities(signals);

  const existingPrefs = await ctx.db
    .query("userPreferences")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .collect();

  const existingByKey = new Map(
    existingPrefs.map((pref) => [`${pref.targetType}/${pref.targetId}`, pref]),
  );
  const desiredKeys = new Set(desired.map((pref) => `${pref.targetType}/${pref.targetId}`));

  for (const pref of desired) {
    const key = `${pref.targetType}/${pref.targetId}`;
    const existing = existingByKey.get(key);

    if (existing) {
      if (existing.score !== pref.score) {
        await ctx.db.patch(existing._id, { score: pref.score, updatedAt: now });
      }
      continue;
    }

    await ctx.db.insert("userPreferences", {
      tokenIdentifier,
      tenantSlug,
      targetType: pref.targetType,
      targetId: pref.targetId,
      score: pref.score,
      updatedAt: now,
    });
  }

  for (const pref of existingPrefs) {
    const key = `${pref.targetType}/${pref.targetId}`;
    if (!desiredKeys.has(key)) {
      await ctx.db.delete(pref._id);
    }
  }
}

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

    const tokenIdentifier = identity.tokenIdentifier;
    const now = Date.now();

    const sameTarget = await ctx.db
      .query("contentInteractions")
      .withIndex("by_tokenIdentifier_and_contentId", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("contentId", args.contentId),
      )
      .collect();

    if (args.type === "like") {
      // Toggle: a content is liked or not. Re-liking removes the like.
      const existingLikes = sameTarget.filter((row) => row.type === "like");
      if (existingLikes.length > 0) {
        for (const like of existingLikes) {
          await ctx.db.delete(like._id);
        }
      } else {
        await ctx.db.insert("contentInteractions", {
          tokenIdentifier,
          tenantSlug: args.tenantSlug,
          contentId: args.contentId,
          type: "like",
          createdAt: now,
        });
      }
    } else if (args.type === "view") {
      // Time-debounced; a recent view is a no-op (and does not re-project).
      const recentView = sameTarget.find(
        (row) => row.type === "view" && now - row.createdAt < VIEW_DEBOUNCE_MS,
      );
      if (recentView) {
        return null;
      }
      await ctx.db.insert("contentInteractions", {
        tokenIdentifier,
        tenantSlug: args.tenantSlug,
        contentId: args.contentId,
        type: "view",
        createdAt: now,
      });
    } else {
      // One-shot signals (open, skip, finish, share, hide): idempotent — record
      // at most one row per (member, content, type) so repeats never stack.
      const alreadyRecorded = sameTarget.some((row) => row.type === args.type);
      if (!alreadyRecorded) {
        await ctx.db.insert("contentInteractions", {
          tokenIdentifier,
          tenantSlug: args.tenantSlug,
          contentId: args.contentId,
          type: args.type,
          createdAt: now,
        });
      }
    }

    await syncAffinities(ctx, tokenIdentifier, args.tenantSlug, now);

    return null;
  },
});

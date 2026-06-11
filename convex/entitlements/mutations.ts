import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { internalMutation, mutation, type MutationCtx } from "../_generated/server";
import { requireCmsAdmin } from "../cms/authz";

// WRITE ADAPTERS for the `entitlements` table.
//
// Today the manual admin grant below (source: "manual") is driven from the CMS
// Users tab. RevenueCat webhooks upsert the SAME row with source: "revenuecat"
// via `revenuecatSync` → `upsertEntitlementInternal`, matching on
// tokenIdentifier/clerkId so the read path never changes.

type UpsertEntitlementArgs = {
  tokenIdentifier?: string;
  clerkId: string;
  isPro: boolean;
  source: "manual" | "revenuecat" | "stripe";
  grantedBy?: Id<"users">;
};

async function upsertEntitlementRow(
  ctx: MutationCtx,
  args: UpsertEntitlementArgs,
): Promise<Id<"entitlements"> | null> {
  let tokenIdentifier = args.tokenIdentifier;

  if (!tokenIdentifier) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) {
      return null;
    }
    tokenIdentifier = user.tokenIdentifier;
  }

  const existing = await ctx.db
    .query("entitlements")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .unique();

  const patch = {
    tokenIdentifier,
    clerkId: args.clerkId,
    isPro: args.isPro,
    source: args.source,
    grantedBy: args.grantedBy,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return existing._id;
  }

  return await ctx.db.insert("entitlements", patch);
}

export const upsertEntitlementInternal = internalMutation({
  args: {
    tokenIdentifier: v.optional(v.string()),
    clerkId: v.string(),
    isPro: v.boolean(),
    source: v.union(
      v.literal("manual"),
      v.literal("revenuecat"),
      v.literal("stripe"),
    ),
    grantedBy: v.optional(v.id("users")),
  },
  returns: v.union(v.id("entitlements"), v.null()),
  handler: async (ctx, args) => upsertEntitlementRow(ctx, args),
});

// Admin-only. Grants the member entitlement to a target user (by their
// `users._id`), writing an entitlement keyed by that user's identifiers.
export const grantMembership = mutation({
  args: { userId: v.id("users") },
  returns: v.object({ isPro: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const admin = await requireCmsAdmin(ctx);
    const target = await ctx.db.get(userId);
    if (!target) {
      throw new Error("User not found");
    }

    await ctx.runMutation(internal.entitlements.mutations.upsertEntitlementInternal, {
      tokenIdentifier: target.tokenIdentifier,
      clerkId: target.clerkId,
      isPro: true,
      source: "manual",
      grantedBy: admin.user?._id,
    });

    return { isPro: true };
  },
});

// Admin-only. Revokes the member entitlement (keeps the row for audit, flips
// `isPro` to false).
export const revokeMembership = mutation({
  args: { userId: v.id("users") },
  returns: v.object({ isPro: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const admin = await requireCmsAdmin(ctx);
    const target = await ctx.db.get(userId);
    if (!target) {
      throw new Error("User not found");
    }

    await ctx.runMutation(internal.entitlements.mutations.upsertEntitlementInternal, {
      tokenIdentifier: target.tokenIdentifier,
      clerkId: target.clerkId,
      isPro: false,
      source: "manual",
      grantedBy: admin.user?._id,
    });

    return { isPro: false };
  },
});

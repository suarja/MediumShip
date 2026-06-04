import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";
import { requireCmsAdmin } from "../cms/authz";

// WRITE ADAPTERS for the `entitlements` table.
//
// Today the only writer is the manual admin grant below (source: "manual"),
// driven from the CMS Users tab — the compromise that unlocks the monetization
// loop without wiring a payment provider yet.
//
// later: a `convex-revenuecat` (and optionally Stripe) webhook will upsert the
// SAME row with source: "revenuecat" / "stripe". It should reuse `upsertEntitlement`
// below (matching on tokenIdentifier/clerkId) so the read path never changes.
// No mobile or gate change is required when that adapter lands.

async function upsertEntitlement(
  ctx: MutationCtx,
  args: {
    tokenIdentifier: string;
    clerkId: string;
    isPro: boolean;
    source: "manual" | "revenuecat" | "stripe";
    grantedBy?: Id<"users">;
  },
) {
  const existing = await ctx.db
    .query("entitlements")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", args.tokenIdentifier),
    )
    .unique();

  const patch = {
    tokenIdentifier: args.tokenIdentifier,
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

// Admin-only. Grants the member entitlement to a target user (by their
// `users._id`), writing an entitlement keyed by that user's identifiers.
export const grantMembership = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const admin = await requireCmsAdmin(ctx);
    const target = await ctx.db.get(userId);
    if (!target) {
      throw new Error("User not found");
    }

    await upsertEntitlement(ctx, {
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
  handler: async (ctx, { userId }) => {
    const admin = await requireCmsAdmin(ctx);
    const target = await ctx.db.get(userId);
    if (!target) {
      throw new Error("User not found");
    }

    await upsertEntitlement(ctx, {
      tokenIdentifier: target.tokenIdentifier,
      clerkId: target.clerkId,
      isPro: false,
      source: "manual",
      grantedBy: admin.user?._id,
    });

    return { isPro: false };
  },
});

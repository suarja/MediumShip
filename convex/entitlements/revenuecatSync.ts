import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { action, internalMutation } from "../_generated/server";
import { revenuecat } from "../revenuecat";
import { getPremiumEntitlementId } from "./premiumEntitlementId";

declare const process: { env: Record<string, string | undefined> };

/**
 * After the `convex-revenuecat` component processes a webhook event, mirror the
 * authoritative component state into our `entitlements` row (`source: "revenuecat"`).
 *
 * `isPro` is ALWAYS derived from `revenuecat.hasEntitlement(clerkId, <entitlement id>)` —
 * never from the raw RC event type/status (cancellation keeps access until expiration).
 */
export const syncForClerkId = internalMutation({
  args: { clerkId: v.string() },
  returns: v.union(v.id("entitlements"), v.null()),
  handler: async (ctx, { clerkId }): Promise<Id<"entitlements"> | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      return null;
    }

    const isPro = await revenuecat.hasEntitlement(ctx, {
      appUserId: clerkId,
      entitlementId: getPremiumEntitlementId(),
    });

    return await ctx.runMutation(
      internal.entitlements.mutations.upsertEntitlementInternal,
      {
        tokenIdentifier: user.tokenIdentifier,
        clerkId,
        isPro,
        source: "revenuecat",
      },
    );
  },
});

/**
 * Called by the mobile client right after a successful purchase/restore so the
 * `entitlements` row updates without waiting for the RC webhook (especially in
 * dev / Test Store). When `REVENUECAT_API_KEY` is set, pulls the subscriber
 * from the RC REST API into the component first.
 */
export const syncAfterPurchase = action({
  args: {},
  returns: v.object({
    synced: v.boolean(),
    isPro: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;
    const apiKey = process.env.REVENUECAT_API_KEY;

    if (apiKey) {
      const response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(clerkId)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = (await response.json()) as {
          subscriber: Parameters<typeof revenuecat.syncSubscriber>[1]["subscriber"];
        };
        await revenuecat.syncSubscriber(ctx, {
          appUserId: clerkId,
          subscriber: data.subscriber,
        });
      }
    }

    await ctx.runMutation(internal.entitlements.revenuecatSync.syncForClerkId, {
      clerkId,
    });

    const isPro = await revenuecat.hasEntitlement(ctx, {
      appUserId: clerkId,
      entitlementId: getPremiumEntitlementId(),
    });

    return { synced: true, isPro };
  },
});

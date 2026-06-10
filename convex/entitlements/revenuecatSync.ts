import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { revenuecat } from "../revenuecat";

// `process.env` is provided by the Convex runtime; declared for the Convex
// tsconfig (no @types/node).
declare const process: { env: Record<string, string | undefined> };

// The RevenueCat entitlement IDENTIFIER (not its display name — e.g. display
// "Knowly Pro" can map to identifier "premium"). White-label: configurable per
// deployment via Convex env (`npx convex env set REVENUECAT_ENTITLEMENT_ID <id>`),
// defaults to "premium". Must match the entitlement identifier in the RC project.
const PREMIUM_ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID ?? "premium";

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
      entitlementId: PREMIUM_ENTITLEMENT_ID,
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

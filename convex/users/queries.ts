import { query } from "../_generated/server";

// Authenticated read used by the profile screen to prove the Clerk -> Convex
// JWT path end-to-end. Returns null (never throws) when the identity is not yet
// available, so the live subscription stays alive across transient auth gaps.
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Prefer the canonical tokenIdentifier; fall back to the Clerk subject in
    // case the issuer domain differs from what the webhook persisted.
    let stored = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!stored) {
      stored = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
    }

    return {
      clerkId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      email: stored?.email ?? identity.email ?? null,
      name: stored?.name ?? identity.name ?? null,
      avatarUrl: stored?.avatarUrl ?? null,
      isStored: stored !== null && stored.deletedAt === undefined,
    };
  },
});

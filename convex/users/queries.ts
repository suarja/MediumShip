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

    const stored = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    return {
      tokenIdentifier: identity.tokenIdentifier,
      email: stored?.email ?? identity.email ?? null,
      name: stored?.name ?? identity.name ?? null,
      lastSeenAt: stored?.lastSeenAt ?? null,
      isStored: stored !== null,
    };
  },
});

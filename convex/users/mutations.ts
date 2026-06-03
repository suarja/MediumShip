import { mutation } from "../_generated/server";

// Upserts the currently authenticated user, keyed by the stable Clerk token
// identifier. Proves an authenticated write path. The identity is derived
// server-side and never passed in as an argument.
export const upsertCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    const fields = {
      email: identity.email,
      name: identity.name,
      lastSeenAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      ...fields,
    });
  },
});

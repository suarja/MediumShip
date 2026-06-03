import { v } from "convex/values";

import { internalMutation, mutation } from "../_generated/server";

// `process.env` is provided by the Convex runtime; declared for the Convex
// tsconfig (no @types/node).
declare const process: { env: Record<string, string | undefined> };

function tokenIdentifierFor(clerkId: string): string {
  const domain = process.env.CLERK_JWT_ISSUER_DOMAIN ?? "";
  return `${domain}|${clerkId}`;
}

/**
 * Lazy upsert from the authenticated session. Lets a freshly signed-in user get
 * a row even before the Clerk webhook is configured/fires — the webhook keeps
 * the same row in sync afterwards (both paths key on clerkId).
 */
export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const fields = {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name,
      lastSeenAt: new Date().toISOString(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      ...fields,
    });
  },
});

/**
 * Server-side sync from the Clerk `user.created` / `user.updated` webhook.
 * Keyed on clerkId; tokenIdentifier is reconstructed so authenticated reads by
 * tokenIdentifier resolve the same row.
 */
export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const fields = {
      tokenIdentifier: tokenIdentifierFor(args.clerkId),
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      deletedAt: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      ...fields,
    });
  },
});

/** Soft delete from the Clerk `user.deleted` webhook. */
export const softDeleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { deletedAt: Date.now() });
    }
  },
});

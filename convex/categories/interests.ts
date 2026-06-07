import { ConvexError } from "convex/values";
import { v } from "convex/values";

import { mutation, query, type QueryCtx } from "../_generated/server";
import { normalizeScoringKey } from "../discovery/scoring";

function normalizeCategoryKeys(categoryKeys: readonly string[]): string[] {
  return [
    ...new Set(
      categoryKeys.map(normalizeScoringKey).filter((key) => key.length > 0),
    ),
  ];
}

export async function loadMemberCategoryInterests(
  ctx: QueryCtx,
  tokenIdentifier: string,
  tenantSlug: string,
): Promise<string[]> {
  const rows = await ctx.db
    .query("categoryInterests")
    .withIndex("by_tokenIdentifier_and_tenant", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier).eq("tenantSlug", tenantSlug),
    )
    .collect();

  return rows.map((row) => row.categoryKey);
}

export const setCategoryInterests = mutation({
  args: {
    tenantSlug: v.string(),
    categoryKeys: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const tokenIdentifier = identity.tokenIdentifier;
    const now = Date.now();
    const nextKeys = normalizeCategoryKeys(args.categoryKeys);

    const existing = await ctx.db
      .query("categoryInterests")
      .withIndex("by_tokenIdentifier_and_tenant", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("tenantSlug", args.tenantSlug),
      )
      .collect();

    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    for (const categoryKey of nextKeys) {
      await ctx.db.insert("categoryInterests", {
        tokenIdentifier,
        tenantSlug: args.tenantSlug,
        categoryKey,
        updatedAt: now,
      });
    }

    return null;
  },
});

export const getMyCategoryInterests = query({
  args: { tenantSlug: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return loadMemberCategoryInterests(
      ctx,
      identity.tokenIdentifier,
      args.tenantSlug,
    );
  },
});

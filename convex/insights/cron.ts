import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction, internalQuery } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { isProFromEntitlement } from "../entitlements/model";
import { mockReportValidator } from "./mockReport";

export const listPremiumMembersQuery = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      tokenIdentifier: v.string(),
      tenantSlug: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const entitlements = await ctx.db.query("entitlements").collect();
    const premium = entitlements.filter((row) =>
      isProFromEntitlement({ isPro: row.isPro, source: row.source }),
    );

    const members: Array<{
      tokenIdentifier: string;
      tenantSlug?: string;
    }> = [];

    for (const row of premium) {
      const pref = await ctx.db
        .query("userPreferences")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", row.tokenIdentifier),
        )
        .first();

      members.push({
        tokenIdentifier: row.tokenIdentifier,
        tenantSlug: pref?.tenantSlug,
      });
    }

    return members;
  },
});

export const generateDailyAnalyses = internalAction({
  args: {
    now: v.optional(v.number()),
    fallbackTenantSlug: v.optional(v.string()),
    mockProse: v.optional(v.string()),
    mockReport: v.optional(mockReportValidator),
  },
  returns: v.object({
    processed: v.number(),
    created: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const fallbackTenantSlug = args.fallbackTenantSlug ?? "demo-media";

    const premiumMembers: Array<{
      tokenIdentifier: string;
      tenantSlug?: string;
    }> = await ctx.runQuery(internal.insights.cron.listPremiumMembersQuery, {});

    let created = 0;
    let skipped = 0;

    for (const member of premiumMembers) {
      const result: Id<"tasteAnalysis"> | null = await ctx.runAction(
        internal.insights.generate.generateForMember,
        {
        tokenIdentifier: member.tokenIdentifier,
        tenantSlug: member.tenantSlug ?? fallbackTenantSlug,
        now,
        mockProse: args.mockProse,
        mockReport: args.mockReport,
        },
      );

      if (result) {
        created += 1;
      } else {
        skipped += 1;
      }
    }

    return {
      processed: premiumMembers.length,
      created,
      skipped,
    };
  },
});

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import {
  MEMBER,
  OTHER_MEMBER,
  seedPremiumMember,
  seedTenant,
  TENANT,
} from "./testHelpers";

describe("markAnalysisSeen", () => {
  it("sets seenAt for the owner", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const asMember = t.withIdentity(MEMBER);

    const analysisId = await t.run(async (ctx) =>
      ctx.db.insert("tasteAnalysis", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        dayKey: "2026-06-10",
        tasteText: "Test",
        relatedContentIds: [],
        model: "mock",
        createdAt: Date.now(),
      }),
    );

    const seenAt = Date.parse("2026-06-10T12:00:00.000Z");
    await asMember.mutation(api.insights.mutations.markAnalysisSeen, {
      analysisId,
      seenAt,
    });

    const row = await t.run(async (ctx) => ctx.db.get(analysisId));
    expect(row?.seenAt).toBe(seenAt);
  });

  it("refuses another member's analysis", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("entitlements", {
        tokenIdentifier: OTHER_MEMBER.tokenIdentifier,
        clerkId: OTHER_MEMBER.subject,
        isPro: true,
        source: "manual",
        updatedAt: Date.now(),
      });
    });

    const analysisId = await t.run(async (ctx) =>
      ctx.db.insert("tasteAnalysis", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        dayKey: "2026-06-10",
        tasteText: "Private",
        relatedContentIds: [],
        model: "mock",
        createdAt: Date.now(),
      }),
    );

    const asOther = t.withIdentity(OTHER_MEMBER);

    await expect(
      asOther.mutation(api.insights.mutations.markAnalysisSeen, { analysisId }),
    ).rejects.toThrow(/Analysis not found/);
  });
});

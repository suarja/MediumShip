import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import {
  FREE_USER,
  insertPublishedContent,
  MEMBER,
  OTHER_MEMBER,
  seedPremiumMember,
  seedTenant,
  TENANT,
} from "./testHelpers";

const NOW = Date.parse("2026-06-10T10:00:00.000Z");

async function seedAnalysis(
  t: ReturnType<typeof convexTest>,
  args: {
    tokenIdentifier?: string;
    seenAt?: number;
    createdAt?: number;
    relatedIds?: Id<"contents">[];
  } = {},
) {
  return t.run(async (ctx) =>
    ctx.db.insert("tasteAnalysis", {
      tokenIdentifier: args.tokenIdentifier ?? MEMBER.tokenIdentifier,
      tenantSlug: TENANT,
      dayKey: "2026-06-10",
      tasteText: "Vos goûts penchent vers la politique.",
      relatedContentIds: args.relatedIds ?? [],
      model: "mock",
      createdAt: args.createdAt ?? NOW,
      seenAt: args.seenAt,
    }),
  );
}

describe("insights queries", () => {
  it("rejects guests and non-members", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);

    await expect(
      t.query(api.insights.queries.getTodayAnalysis, { dayKey: "2026-06-10" }),
    ).rejects.toThrow(/Unauthenticated/);

    const asFree = t.withIdentity(FREE_USER);
    await expect(
      asFree.query(api.insights.queries.getTodayAnalysis, { dayKey: "2026-06-10" }),
    ).rejects.toThrow(/Member access required/);
  });

  it("returns today analysis with published related only", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const asMember = t.withIdentity(MEMBER);

    const publishedId = await insertPublishedContent(t, { title: "Published" });
    await insertPublishedContent(t, { title: "Draft" });

    await t.run(async (ctx) => {
      const draft = await ctx.db
        .query("contents")
        .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", TENANT))
        .collect();
      const draftDoc = draft.find((row) => row.title === "Draft");
      if (draftDoc) {
        await ctx.db.patch(draftDoc._id, { status: "draft" });
      }
    });

    await seedAnalysis(t, { relatedIds: [publishedId] });

    const today = await asMember.query(api.insights.queries.getTodayAnalysis, {
      dayKey: "2026-06-10",
    });
    expect(today?.related).toHaveLength(1);
    expect(today?.related[0]?._id).toBe(publishedId);
  });

  it("returns the latest analysis regardless of dayKey", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const asMember = t.withIdentity(MEMBER);

    await seedAnalysis(t, { createdAt: NOW - 10_000 });
    const latestId = await seedAnalysis(t, { createdAt: NOW });

    const latest = await asMember.query(api.insights.queries.getLatestAnalysis, {});
    expect(latest?._id).toBe(latestId);
  });

  it("returns the newest unseen analysis within 48h", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const asMember = t.withIdentity(MEMBER);

    await seedAnalysis(t, {
      createdAt: NOW - 60_000,
      seenAt: NOW - 30_000,
    });
    const unseenId = await seedAnalysis(t, { createdAt: NOW - 30_000 });

    const unseen = await asMember.query(api.insights.queries.getUnseenAnalysis, {
      now: NOW,
    });

    expect(unseen?._id).toBe(unseenId);
  });

  it("accepts legacy asOf arg", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const asMember = t.withIdentity(MEMBER);

    const unseenId = await seedAnalysis(t, { createdAt: NOW - 30_000 });

    const unseen = await asMember.query(api.insights.queries.getUnseenAnalysis, {
      asOf: NOW,
    });

    expect(unseen?._id).toBe(unseenId);
  });

  it("returns null when unseen is older than 48h", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const asMember = t.withIdentity(MEMBER);

    await seedAnalysis(t, {
      createdAt: NOW - 49 * 60 * 60 * 1000,
    });

    const unseen = await asMember.query(api.insights.queries.getUnseenAnalysis, {
      now: NOW,
    });

    expect(unseen).toBeNull();
  });

  it("returns newest unseen without now cutoff", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const asMember = t.withIdentity(MEMBER);

    const oldUnseenId = await seedAnalysis(t, {
      createdAt: NOW - 49 * 60 * 60 * 1000,
    });

    const unseen = await asMember.query(api.insights.queries.getUnseenAnalysis, {});
    expect(unseen?._id).toBe(oldUnseenId);
  });

  it("lists analyses antechronologically with cap", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const asMember = t.withIdentity(MEMBER);

    await seedAnalysis(t, { createdAt: NOW - 10_000 });
    await seedAnalysis(t, { createdAt: NOW });

    const list = await asMember.query(api.insights.queries.listMyAnalyses, {});
    expect(list[0]?.createdAt).toBeGreaterThan(list[1]?.createdAt ?? 0);
  });

  it("getAnalysisById returns null for another member", async () => {
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

    const analysisId = await seedAnalysis(t);
    const asOther = t.withIdentity(OTHER_MEMBER);

    const result = await asOther.query(api.insights.queries.getAnalysisById, {
      analysisId,
    });

    expect(result).toBeNull();
  });
});

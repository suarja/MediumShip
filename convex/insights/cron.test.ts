import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { formatDayKey } from "./dayKey";
import {
  FREE_USER,
  insertPublishedContent,
  MEMBER,
  seedPremiumMember,
  seedTenant,
  TENANT,
} from "./testHelpers";

const NOW = Date.parse("2026-06-10T10:00:00.000Z");

describe("generateDailyAnalyses", () => {
  it("generates only for premium members", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    await insertPublishedContent(t, { title: "Cron story" });

    await t.run(async (ctx) => {
      await ctx.db.insert("entitlements", {
        tokenIdentifier: FREE_USER.tokenIdentifier,
        clerkId: FREE_USER.subject,
        isPro: false,
        source: "manual",
        updatedAt: Date.now(),
      });
    });

    const result = await t.action(internal.insights.cron.generateDailyAnalyses, {
      now: NOW,
      fallbackTenantSlug: TENANT,
      mockProse: "Cron prose",
    });

    expect(result.processed).toBe(1);
    expect(result.created).toBe(1);

    const rows = await t.run(async (ctx) => ctx.db.query("tasteAnalysis").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenIdentifier).toBe(MEMBER.tokenIdentifier);
  });

  it("is idempotent when rerun the same day", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    await insertPublishedContent(t, { title: "Cron idempotent" });

    const first = await t.action(internal.insights.cron.generateDailyAnalyses, {
      now: NOW,
      mockProse: "First run",
    });
    const second = await t.action(internal.insights.cron.generateDailyAnalyses, {
      now: NOW + 3_600_000,
      mockProse: "Second run",
    });

    expect(first.created).toBe(1);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(1);

    const count = await t.run(async (ctx) => {
      const rows = await ctx.db
        .query("tasteAnalysis")
        .withIndex("by_tokenIdentifier_and_dayKey", (q) =>
          q
            .eq("tokenIdentifier", MEMBER.tokenIdentifier)
            .eq("dayKey", formatDayKey(NOW)),
        )
        .collect();
      return rows.length;
    });

    expect(count).toBe(1);
  });

  it("skips member with unseen briefing when no new signal since briefing", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    await insertPublishedContent(t, { title: "Cron unseen skip" });

    await t.run(async (ctx) => {
      await ctx.db.insert("tasteAnalysis", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        dayKey: formatDayKey(NOW - 86_400_000),
        tasteText: "Briefing non lu.",
        relatedContentIds: [],
        model: "mock",
        createdAt: NOW - 86_400_000,
      });
      // No interactions or bookmarks after createdAt → anti-cost guard skips.
    });

    const result = await t.action(internal.insights.cron.generateDailyAnalyses, {
      now: NOW,
      fallbackTenantSlug: TENANT,
      mockProse: "Should not be created",
    });

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);

    const rows = await t.run(async (ctx) => ctx.db.query("tasteAnalysis").collect());
    expect(rows).toHaveLength(1);
  });

  it("refreshes unseen briefing in-place when new signals exist (no duplicate row)", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    const contentId = await insertPublishedContent(t, { title: "Cron refresh" });
    const UNSEEN_CREATED_AT = NOW - 86_400_000;

    await t.run(async (ctx) => {
      await ctx.db.insert("tasteAnalysis", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        dayKey: formatDayKey(UNSEEN_CREATED_AT),
        tasteText: "Ancien briefing non lu.",
        relatedContentIds: [],
        model: "mock",
        createdAt: UNSEEN_CREATED_AT,
        // seenAt intentionally absent → unseen
      });
      // New interaction AFTER the unseen briefing → triggers refresh.
      await ctx.db.insert("contentInteractions", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        contentId,
        type: "open",
        createdAt: UNSEEN_CREATED_AT + 3_600_000,
      });
    });

    const result = await t.action(internal.insights.cron.generateDailyAnalyses, {
      now: NOW,
      fallbackTenantSlug: TENANT,
      mockProse: "Briefing rafraîchi.",
    });

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);

    // Must still be exactly 1 row (refreshed in-place, not a new insert).
    const rows = await t.run(async (ctx) => ctx.db.query("tasteAnalysis").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tasteText).toBe("Briefing rafraîchi.");
    expect(rows[0]?.dayKey).toBe(formatDayKey(NOW));
  });

  it("forwards mockReport to generateForMember", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    await insertPublishedContent(t, { title: "Cron structured" });

    const mockReport = {
      overview: "Vue d'ensemble cron.",
      reflection: "Depuis la dernière fois.",
      trends: "Plus de long format.",
      picks: [{ slot: 1, rationale: "Parce que ça colle." }],
    };

    await t.action(internal.insights.cron.generateDailyAnalyses, {
      now: NOW,
      fallbackTenantSlug: TENANT,
      mockReport,
    });

    const row = await t.run(async (ctx) => {
      const rows = await ctx.db.query("tasteAnalysis").collect();
      return rows[0] ?? null;
    });

    expect(row?.tasteText).toBe(
      `${mockReport.overview} ${mockReport.reflection} ${mockReport.trends}`,
    );
    expect(row?.reflection).toBeUndefined();
    expect(row?.relatedPicks?.[0]?.rationale).toBe(mockReport.picks[0]?.rationale);
  });
});

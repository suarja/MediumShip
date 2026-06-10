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
});

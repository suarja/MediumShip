import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { formatDayKey } from "./dayKey";
import {
  insertPublishedContent,
  MEMBER,
  seedPremiumMember,
  seedTenant,
  TENANT,
} from "./testHelpers";

const NOW = Date.parse("2026-06-10T10:00:00.000Z");
const MOCK_REPORT = {
  overview: "Vous aimez la politique et les analyses longues.",
  reflection: "Depuis la dernière analyse, plus d'épisodes longs.",
  trends: "Les formats approfondis dominent.",
  picks: [{ slot: 1, rationale: "Pour prolonger vos lectures récentes." }],
};

describe("generateForMember", () => {
  it("inserts a taste analysis with mocked prose", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    await insertPublishedContent(t, { title: "Story A" });

    const analysisId = await t.action(internal.insights.generate.generateForMember, {
      tokenIdentifier: MEMBER.tokenIdentifier,
      tenantSlug: TENANT,
      now: NOW,
      mockReport: MOCK_REPORT,
    });

    expect(analysisId).not.toBeNull();

    const row = await t.run(async (ctx) =>
      analysisId ? ctx.db.get(analysisId) : null,
    );

    expect(row?.tasteText).toBe(MOCK_REPORT.overview);
    expect(row?.reflection).toBe(MOCK_REPORT.reflection);
    expect(row?.relatedPicks?.[0]?.rationale).toBe(MOCK_REPORT.picks[0]?.rationale);
    expect(row?.dayKey).toBe(formatDayKey(NOW));
    expect(row?.relatedContentIds.length).toBeGreaterThan(0);
  });

  it("is idempotent for the same dayKey", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    await insertPublishedContent(t, { title: "Story B" });

    const first = await t.action(internal.insights.generate.generateForMember, {
      tokenIdentifier: MEMBER.tokenIdentifier,
      tenantSlug: TENANT,
      now: NOW,
      mockReport: MOCK_REPORT,
    });

    const second = await t.action(internal.insights.generate.generateForMember, {
      tokenIdentifier: MEMBER.tokenIdentifier,
      tenantSlug: TENANT,
      now: NOW + 60_000,
      mockReport: {
        ...MOCK_REPORT,
        overview: "Should not insert",
      },
    });

    expect(first).not.toBeNull();
    expect(second).toBeNull();

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

  it("handles cold start with mocked prose", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await seedPremiumMember(t);
    await insertPublishedContent(t, { title: "Fallback" });

    const analysisId = await t.action(internal.insights.generate.generateForMember, {
      tokenIdentifier: MEMBER.tokenIdentifier,
      tenantSlug: TENANT,
      now: NOW,
      mockProse: "Bienvenue — votre profil se construit.",
    });

    expect(analysisId).not.toBeNull();
  });
});

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import schema from "../schema";
import { modules } from "../../convexTestModules";
import { summarizeSignals } from "./signals";
import { MEMBER, seedTenant, TENANT } from "./testHelpers";

describe("summarizeSignals", () => {
  it("aggregates categories, tags, and counters", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("userPreferences", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        targetType: "category",
        targetId: "politique",
        score: 120,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("userPreferences", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        targetType: "tag",
        targetId: "democratie",
        score: 80,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("categoryInterests", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        categoryKey: "economie",
        updatedAt: Date.now(),
      });
      await ctx.db.insert("bookmarks", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        contentId: await ctx.db.insert("contents", {
          tenantSlug: TENANT,
          kind: "article",
          status: "published",
          slug: "seed",
          title: "Seed",
          summary: "s",
          category: "Politique",
          tags: [],
          isPremium: false,
        }),
        createdAt: Date.now(),
      });
    });

    const summary = await t.run(async (ctx) =>
      summarizeSignals(ctx, MEMBER.tokenIdentifier, TENANT),
    );

    expect(summary.topCategories[0]?.key).toBe("politique");
    expect(summary.topTags[0]?.key).toBe("democratie");
    expect(summary.explicitInterests).toContain("economie");
    expect(summary.bookmarkCount).toBe(1);
    expect(summary.isColdStart).toBe(false);
  });

  it("caps top lists and reports cold start", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);

    await t.run(async (ctx) => {
      for (let index = 0; index < 8; index += 1) {
        await ctx.db.insert("userPreferences", {
          tokenIdentifier: MEMBER.tokenIdentifier,
          tenantSlug: TENANT,
          targetType: "category",
          targetId: `cat-${index}`,
          score: index,
          updatedAt: Date.now(),
        });
      }
    });

    const summary = await t.run(async (ctx) =>
      summarizeSignals(ctx, MEMBER.tokenIdentifier, TENANT),
    );

    expect(summary.topCategories).toHaveLength(5);
    expect(summary.topCategories[0]?.key).toBe("cat-7");
  });

  it("returns cold start when no signals exist", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);

    const summary = await t.run(async (ctx) =>
      summarizeSignals(ctx, MEMBER.tokenIdentifier, TENANT),
    );

    expect(summary.isColdStart).toBe(true);
    expect(summary.bookmarkCount).toBe(0);
  });
});

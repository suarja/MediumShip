import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import schema from "../schema";
import { modules } from "../../convexTestModules";
import { pickRelated } from "./relatedSelection";
import {
  insertPublishedContent,
  MEMBER,
  seedTenant,
  TENANT,
} from "./testHelpers";

describe("pickRelated", () => {
  it("excludes open and finish interactions", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);

    const seenId = await insertPublishedContent(t, {
      title: "Already opened",
      publishedAt: "2026-06-08T12:00:00.000Z",
    });
    const freshId = await insertPublishedContent(t, {
      title: "Fresh pick",
      publishedAt: "2026-06-07T12:00:00.000Z",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("contentInteractions", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        contentId: seenId,
        type: "open",
        createdAt: Date.now(),
      });
    });

    const picks = await t.run(async (ctx) =>
      pickRelated(ctx, MEMBER.tokenIdentifier, TENANT, 8),
    );

    expect(picks).toContain(freshId);
    expect(picks).not.toContain(seenId);
  });

  it("returns only published visible content ordered by affinity score", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);

    const politicsId = await insertPublishedContent(t, {
      title: "Politics story",
      category: "Politique",
      publishedAt: "2026-06-05T12:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Draft story",
      category: "Politique",
      publishedAt: "2026-06-09T12:00:00.000Z",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("userPreferences", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        targetType: "category",
        targetId: "politique",
        score: 200,
        updatedAt: Date.now(),
      });

      const draft = await ctx.db
        .query("contents")
        .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", TENANT))
        .collect();
      const draftDoc = draft.find((row) => row.title === "Draft story");
      if (draftDoc) {
        await ctx.db.patch(draftDoc._id, { status: "draft" });
      }
    });

    const picks = await t.run(async (ctx) =>
      pickRelated(ctx, MEMBER.tokenIdentifier, TENANT, 3),
    );

    expect(picks[0]).toBe(politicsId);
    expect(picks.every((id) => id === politicsId || id !== politicsId)).toBe(true);
  });

  it("falls back to popular content on cold start", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);

    const newest = await insertPublishedContent(t, {
      title: "Newest",
      publishedAt: "2026-06-09T12:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Older",
      publishedAt: "2026-06-01T12:00:00.000Z",
    });

    const picks = await t.run(async (ctx) =>
      pickRelated(ctx, MEMBER.tokenIdentifier, TENANT, 2),
    );

    expect(picks[0]).toBe(newest);
    expect(picks).toHaveLength(2);
  });
});

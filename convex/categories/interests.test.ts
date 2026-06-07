/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const TENANT = "demo-media";
const MEMBER = { subject: "member_1", tokenIdentifier: "token_member" };

describe("category interests", () => {
  it("stores normalized keys idempotently and replaces the full set on re-call", async () => {
    const t = convexTest(schema, modules);
    const asMember = t.withIdentity(MEMBER);

    await asMember.mutation(api.categories.interests.setCategoryInterests, {
      tenantSlug: TENANT,
      categoryKeys: ["Science", " Philosophie "],
    });

    let rows = await t.run(async (ctx) =>
      ctx.db.query("categoryInterests").collect(),
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.categoryKey).sort()).toEqual([
      "philosophie",
      "science",
    ]);

    await asMember.mutation(api.categories.interests.setCategoryInterests, {
      tenantSlug: TENANT,
      categoryKeys: ["Culture"],
    });

    rows = await t.run(async (ctx) =>
      ctx.db.query("categoryInterests").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.categoryKey).toBe("culture");
  });

  it("returns the current set via getMyCategoryInterests", async () => {
    const t = convexTest(schema, modules);
    const asMember = t.withIdentity(MEMBER);

    await asMember.mutation(api.categories.interests.setCategoryInterests, {
      tenantSlug: TENANT,
      categoryKeys: ["Science", "Philosophie"],
    });

    const interests = await asMember.query(
      api.categories.interests.getMyCategoryInterests,
      { tenantSlug: TENANT },
    );

    expect(interests.sort()).toEqual(["philosophie", "science"]);
  });

  it("rejects unauthenticated writes", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.categories.interests.setCategoryInterests, {
        tenantSlug: TENANT,
        categoryKeys: ["Science"],
      }),
    ).rejects.toThrow("Unauthorized");
  });

  it("does not touch userPreferences or contentInteractions when interests change", async () => {
    const t = convexTest(schema, modules);
    const asMember = t.withIdentity(MEMBER);

    await t.run(async (ctx) => {
      const contentId = await ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "article",
        status: "published",
        slug: "liked-story",
        title: "Liked story",
        summary: "Summary",
        category: "Science",
        tags: [],
        isPremium: false,
        publishedAt: "2026-06-01T08:00:00.000Z",
      });

      await ctx.db.insert("userPreferences", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        targetType: "category",
        targetId: "science",
        score: 50,
        updatedAt: 1,
      });

      await ctx.db.insert("contentInteractions", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        contentId,
        type: "like",
        createdAt: 1,
      });
    });

    await asMember.mutation(api.categories.interests.setCategoryInterests, {
      tenantSlug: TENANT,
      categoryKeys: ["Culture"],
    });

    await asMember.mutation(api.categories.interests.setCategoryInterests, {
      tenantSlug: TENANT,
      categoryKeys: [],
    });

    const prefs = await t.run(async (ctx) =>
      ctx.db.query("userPreferences").collect(),
    );
    const interactions = await t.run(async (ctx) =>
      ctx.db.query("contentInteractions").collect(),
    );

    expect(prefs).toHaveLength(1);
    expect(prefs[0]?.score).toBe(50);
    expect(interactions).toHaveLength(1);
    expect(interactions[0]?.type).toBe("like");
  });
});

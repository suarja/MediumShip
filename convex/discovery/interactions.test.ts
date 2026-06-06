import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const TENANT = "demo-media";
const MEMBER = { subject: "member_1", tokenIdentifier: "token_member" };

async function seedTenant(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("tenants", {
      slug: TENANT,
      name: "Demo Media",
      enabledModules: ["articles", "discover"],
    });
  });
}

async function insertPublishedContent(
  t: ReturnType<typeof convexTest>,
  args: {
    category?: string;
    tags?: string[];
    kind?: "article" | "episode" | "video";
  } = {},
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: TENANT,
      kind: args.kind ?? "article",
      status: "published",
      slug: "sample-content",
      title: "Sample content",
      summary: "Summary",
      category: args.category ?? "Politique",
      tags: args.tags ?? ["Démocratie"],
      isPremium: false,
      publishedAt: "2026-06-01T08:00:00.000Z",
    }),
  );
}

describe("recordInteraction", () => {
  it("inserts a contentInteractions row for a signed-in member", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);
    const asMember = t.withIdentity(MEMBER);

    await asMember.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "like",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("contentInteractions")
        .withIndex("by_tokenIdentifier_and_contentId", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier).eq("contentId", contentId),
        )
        .collect(),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.type).toBe("like");
  });

  it("updates affinities on like using normalized scoring keys", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);
    const asMember = t.withIdentity(MEMBER);

    await asMember.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "like",
    });

    const prefs = await t.run(async (ctx) =>
      ctx.db
        .query("userPreferences")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier),
        )
        .collect(),
    );

    const category = prefs.find(
      (pref) => pref.targetType === "category" && pref.targetId === "politique",
    );
    const tag = prefs.find(
      (pref) => pref.targetType === "tag" && pref.targetId === "democratie",
    );

    expect(category?.score).toBe(50);
    expect(tag?.score).toBe(25);
  });

  it("lowers affinities on skip", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);
    const asMember = t.withIdentity(MEMBER);

    await asMember.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "skip",
    });

    const prefs = await t.run(async (ctx) =>
      ctx.db
        .query("userPreferences")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier),
        )
        .collect(),
    );

    expect(
      prefs.find(
        (pref) => pref.targetType === "category" && pref.targetId === "politique",
      )?.score,
    ).toBe(-10);
  });

  it("applies a large negative on hide", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);
    const asMember = t.withIdentity(MEMBER);

    await asMember.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "hide",
    });

    const prefs = await t.run(async (ctx) =>
      ctx.db
        .query("userPreferences")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier),
        )
        .collect(),
    );

    expect(
      prefs.find(
        (pref) => pref.targetType === "category" && pref.targetId === "politique",
      )?.score,
    ).toBe(-100);
  });

  it("debounces duplicate view interactions within 60 seconds", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);
    const asMember = t.withIdentity(MEMBER);

    await asMember.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "view",
    });
    await asMember.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "view",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("contentInteractions")
        .withIndex("by_tokenIdentifier_and_contentId", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier).eq("contentId", contentId),
        )
        .collect(),
    );

    expect(rows).toHaveLength(1);
  });

  it("toggles the like off on a second like and never inflates the score", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);
    const asMember = t.withIdentity(MEMBER);

    // Re-encountering the same content and liking it three times across refreshes
    // must net to "liked once" (50), never 3 × 50 = 150.
    for (let i = 0; i < 3; i += 1) {
      await asMember.mutation(api.discovery.interactions.recordInteraction, {
        tenantSlug: TENANT,
        contentId,
        type: "like",
      });
    }

    const likeRows = await t.run(async (ctx) =>
      ctx.db
        .query("contentInteractions")
        .withIndex("by_tokenIdentifier_and_contentId", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier).eq("contentId", contentId),
        )
        .collect(),
    );
    const prefs = await t.run(async (ctx) =>
      ctx.db
        .query("userPreferences")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier),
        )
        .collect(),
    );

    expect(likeRows.filter((row) => row.type === "like")).toHaveLength(1);
    expect(
      prefs.find(
        (pref) => pref.targetType === "category" && pref.targetId === "politique",
      )?.score,
    ).toBe(50);
  });

  it("removes the affinity entirely when a like is toggled fully off", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);
    const asMember = t.withIdentity(MEMBER);

    await asMember.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "like",
    });
    await asMember.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "like",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("contentInteractions").collect(),
    );
    const prefs = await t.run(async (ctx) => ctx.db.query("userPreferences").collect());

    expect(rows).toHaveLength(0);
    expect(prefs).toHaveLength(0);
  });

  it("does not stack repeated skips", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);
    const asMember = t.withIdentity(MEMBER);

    for (let i = 0; i < 3; i += 1) {
      await asMember.mutation(api.discovery.interactions.recordInteraction, {
        tenantSlug: TENANT,
        contentId,
        type: "skip",
      });
    }

    const skipRows = await t.run(async (ctx) =>
      ctx.db
        .query("contentInteractions")
        .withIndex("by_tokenIdentifier_and_contentId", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier).eq("contentId", contentId),
        )
        .collect(),
    );
    const prefs = await t.run(async (ctx) =>
      ctx.db
        .query("userPreferences")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier),
        )
        .collect(),
    );

    expect(skipRows.filter((row) => row.type === "skip")).toHaveLength(1);
    expect(
      prefs.find(
        (pref) => pref.targetType === "category" && pref.targetId === "politique",
      )?.score,
    ).toBe(-10);
  });

  it("silently ignores guests without inserting a row", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    const contentId = await insertPublishedContent(t);

    await t.mutation(api.discovery.interactions.recordInteraction, {
      tenantSlug: TENANT,
      contentId,
      type: "like",
    });

    const rows = await t.run(async (ctx) => ctx.db.query("contentInteractions").collect());
    const prefs = await t.run(async (ctx) => ctx.db.query("userPreferences").collect());

    expect(rows).toHaveLength(0);
    expect(prefs).toHaveLength(0);
  });
});

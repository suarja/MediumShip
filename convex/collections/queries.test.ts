/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const TENANT = "demo-media";

async function seedPublishedCollection(
  t: ReturnType<typeof convexTest>,
  slug: string,
  title: string,
) {
  return t.run(async (ctx) =>
    ctx.db.insert("collections", {
      tenantSlug: TENANT,
      status: "published",
      slug,
      title,
      summary: `Summary for ${title}`,
      updatedAt: Date.now(),
    }),
  );
}

async function seedPublishedContent(
  t: ReturnType<typeof convexTest>,
  slug: string,
  kind: "article" | "episode" | "video" = "article",
) {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: TENANT,
      kind,
      status: "published",
      slug,
      title: `Content ${slug}`,
      summary: "Summary",
      category: "Test",
      tags: [],
      isPremium: false,
    }),
  );
}

describe("listPublishedCollections", () => {
  it("returns only published collections for the tenant", async () => {
    const t = convexTest(schema, modules);

    await seedPublishedCollection(t, "published-coll", "Published Collection");
    await t.run(async (ctx) => {
      await ctx.db.insert("collections", {
        tenantSlug: TENANT,
        status: "draft",
        slug: "draft-coll",
        title: "Draft Collection",
        summary: "Draft",
        updatedAt: Date.now(),
      });
    });

    const result = await t.query(api.collections.queries.listPublishedCollections, {
      tenantSlug: TENANT,
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Published Collection");
    expect(result[0].slug).toBe("published-coll");
  });

  it("returns itemCount reflecting published items", async () => {
    const t = convexTest(schema, modules);

    const collId = await seedPublishedCollection(t, "coll-a", "Collection A");
    const contentId1 = await seedPublishedContent(t, "content-1");
    const contentId2 = await seedPublishedContent(t, "content-2", "episode");

    await t.run(async (ctx) => {
      await ctx.db.insert("collectionItems", {
        tenantSlug: TENANT,
        collectionId: collId,
        contentId: contentId1,
        order: 1,
      });
      await ctx.db.insert("collectionItems", {
        tenantSlug: TENANT,
        collectionId: collId,
        contentId: contentId2,
        order: 2,
      });
    });

    const result = await t.query(api.collections.queries.listPublishedCollections, {
      tenantSlug: TENANT,
    });

    expect(result[0].itemCount).toBe(2);
  });

  it("returns 0 results for a different tenant", async () => {
    const t = convexTest(schema, modules);
    await seedPublishedCollection(t, "coll-a", "Collection A");

    const result = await t.query(api.collections.queries.listPublishedCollections, {
      tenantSlug: "other-tenant",
    });

    expect(result).toHaveLength(0);
  });
});

describe("getPublishedCollectionById", () => {
  it("returns null for a draft collection", async () => {
    const t = convexTest(schema, modules);

    const collId = await t.run(async (ctx) =>
      ctx.db.insert("collections", {
        tenantSlug: TENANT,
        status: "draft",
        slug: "draft-coll",
        title: "Draft",
        summary: "Draft",
        updatedAt: Date.now(),
      }),
    );

    const result = await t.query(api.collections.queries.getPublishedCollectionById, {
      id: collId,
    });

    expect(result).toBeNull();
  });

  it("returns CollectionDetail with items ordered by order field", async () => {
    const t = convexTest(schema, modules);

    const collId = await seedPublishedCollection(t, "ordered-coll", "Ordered Collection");
    const contentId1 = await seedPublishedContent(t, "art-1");
    const contentId2 = await seedPublishedContent(t, "ep-1", "episode");
    const contentId3 = await seedPublishedContent(t, "vid-1", "video");

    await t.run(async (ctx) => {
      await ctx.db.insert("collectionItems", { tenantSlug: TENANT, collectionId: collId, contentId: contentId3, order: 3 });
      await ctx.db.insert("collectionItems", { tenantSlug: TENANT, collectionId: collId, contentId: contentId1, order: 1 });
      await ctx.db.insert("collectionItems", { tenantSlug: TENANT, collectionId: collId, contentId: contentId2, order: 2 });
    });

    const result = await t.query(api.collections.queries.getPublishedCollectionById, {
      id: collId,
    });

    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(3);
    expect(result!.items[0].contentId).toBe(contentId1);
    expect(result!.items[1].contentId).toBe(contentId2);
    expect(result!.items[2].contentId).toBe(contentId3);
  });

  it("excludes draft/archived content from items", async () => {
    const t = convexTest(schema, modules);

    const collId = await seedPublishedCollection(t, "coll-b", "Collection B");
    const publishedId = await seedPublishedContent(t, "pub-content");
    const draftId = await t.run(async (ctx) =>
      ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "article",
        status: "draft",
        slug: "draft-content",
        title: "Draft Content",
        summary: "Draft",
        category: "Test",
        tags: [],
        isPremium: false,
      }),
    );

    await t.run(async (ctx) => {
      await ctx.db.insert("collectionItems", { tenantSlug: TENANT, collectionId: collId, contentId: publishedId, order: 1 });
      await ctx.db.insert("collectionItems", { tenantSlug: TENANT, collectionId: collId, contentId: draftId, order: 2 });
    });

    const result = await t.query(api.collections.queries.getPublishedCollectionById, {
      id: collId,
    });

    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].contentId).toBe(publishedId);
  });

  it("works for a guest (no auth required)", async () => {
    const t = convexTest(schema, modules);
    const collId = await seedPublishedCollection(t, "guest-coll", "Guest Collection");

    const result = await t.query(api.collections.queries.getPublishedCollectionById, {
      id: collId,
    });

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Guest Collection");
  });
});

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const ADMIN = { subject: "admin_1", tokenIdentifier: "token_admin" };
const GUEST = { subject: "guest_1", tokenIdentifier: "token_guest" };

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: ADMIN.tokenIdentifier,
      clerkId: ADMIN.subject,
      email: "admin@test.com",
      cmsRole: "admin",
    });
  });
}

async function seedContent(
  t: ReturnType<typeof convexTest>,
  slug: string,
  tenantSlug = "demo-media",
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug,
      kind: "article",
      status: "published",
      slug,
      title: `Title for ${slug}`,
      summary: "summary",
      category: "Analyses",
      tags: [],
      isPremium: false,
    }),
  );
}

describe("cms collections", () => {
  it("rejects non-admin on listCmsCollections", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    await expect(
      t.withIdentity(GUEST).query(api.cms.collections.listCmsCollections, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("listCmsCollections returns all statuses for the tenant", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const draftId = await asAdmin.mutation(api.cms.collections.createCollection, {
      title: "Draft collection",
      slug: "draft-coll",
      summary: "draft",
    });
    const publishedId = await asAdmin.mutation(api.cms.collections.createCollection, {
      title: "Published collection",
      slug: "published-coll",
      summary: "published",
    });
    await asAdmin.mutation(api.cms.collections.setCollectionStatus, {
      id: publishedId,
      status: "published",
    });
    const archivedId = await asAdmin.mutation(api.cms.collections.createCollection, {
      title: "Archived collection",
      slug: "archived-coll",
      summary: "archived",
    });
    await asAdmin.mutation(api.cms.collections.setCollectionStatus, {
      id: archivedId,
      status: "archived",
    });

    const list = await asAdmin.query(api.cms.collections.listCmsCollections, {});
    const ids = list.map((row) => row._id);

    expect(ids).toContain(draftId);
    expect(ids).toContain(publishedId);
    expect(ids).toContain(archivedId);
    expect(list.find((row) => row._id === draftId)?.status).toBe("draft");
  });

  it("createCollection inserts draft and enforces unique slug per tenant", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const id = await asAdmin.mutation(api.cms.collections.createCollection, {
      title: "My collection",
      slug: "my-collection",
      summary: "A curated set",
    });

    const doc = await asAdmin.query(api.cms.collections.getCmsCollection, { id });
    expect(doc?.collection.status).toBe("draft");
    expect(doc?.collection.slug).toBe("my-collection");

    await expect(
      asAdmin.mutation(api.cms.collections.createCollection, {
        title: "Duplicate",
        slug: "my-collection",
        summary: "again",
      }),
    ).rejects.toThrow(/Slug already exists/);
  });

  it("updateCollection patches metadata", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const id = await asAdmin.mutation(api.cms.collections.createCollection, {
      title: "Before",
      slug: "before",
      summary: "old",
    });

    await asAdmin.mutation(api.cms.collections.updateCollection, {
      id,
      slug: "after",
      title: "After",
      summary: "new summary",
      coverImageUrl: null,
    });

    const doc = await asAdmin.query(api.cms.collections.getCmsCollection, { id });
    expect(doc?.collection.title).toBe("After");
    expect(doc?.collection.slug).toBe("after");
    expect(doc?.collection.summary).toBe("new summary");
  });

  it("setCollectionStatus flips draft, published, and archived", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const id = await asAdmin.mutation(api.cms.collections.createCollection, {
      title: "Status flow",
      slug: "status-flow",
      summary: "flow",
    });

    await asAdmin.mutation(api.cms.collections.setCollectionStatus, {
      id,
      status: "published",
    });
    let doc = await asAdmin.query(api.cms.collections.getCmsCollection, { id });
    expect(doc?.collection.status).toBe("published");

    await asAdmin.mutation(api.cms.collections.setCollectionStatus, {
      id,
      status: "archived",
    });
    doc = await asAdmin.query(api.cms.collections.getCmsCollection, { id });
    expect(doc?.collection.status).toBe("archived");

    await asAdmin.mutation(api.cms.collections.setCollectionStatus, {
      id,
      status: "draft",
    });
    doc = await asAdmin.query(api.cms.collections.getCmsCollection, { id });
    expect(doc?.collection.status).toBe("draft");
  });

  it("setCollectionItems clears and re-inserts items in order", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const contentA = await seedContent(t, "item-a");
    const contentB = await seedContent(t, "item-b");
    const collectionId = await asAdmin.mutation(api.cms.collections.createCollection, {
      title: "Ordered",
      slug: "ordered",
      summary: "items",
    });

    await asAdmin.mutation(api.cms.collections.setCollectionItems, {
      collectionId,
      contentIds: [contentA, contentB],
    });

    let doc = await asAdmin.query(api.cms.collections.getCmsCollection, {
      id: collectionId,
    });
    expect(doc?.items.map((item) => item.contentId)).toEqual([contentA, contentB]);
    expect(doc?.items.map((item) => item.order)).toEqual([0, 1]);

    await asAdmin.mutation(api.cms.collections.setCollectionItems, {
      collectionId,
      contentIds: [contentB, contentA],
    });

    doc = await asAdmin.query(api.cms.collections.getCmsCollection, { id: collectionId });
    expect(doc?.items.map((item) => item.contentId)).toEqual([contentB, contentA]);
  });

  it("setCollectionItems rejects content from another tenant", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const foreignContent = await seedContent(t, "foreign", "other-tenant");
    const collectionId = await asAdmin.mutation(api.cms.collections.createCollection, {
      title: "Tenant scoped",
      slug: "tenant-scoped",
      summary: "items",
    });

    await expect(
      asAdmin.mutation(api.cms.collections.setCollectionItems, {
        collectionId,
        contentIds: [foreignContent],
      }),
    ).rejects.toThrow(/another tenant/);
  });
});

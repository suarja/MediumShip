import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const FREE_USER = { subject: "user_free", tokenIdentifier: "token_free" };
const MEMBER_USER = { subject: "user_pro", tokenIdentifier: "token_pro" };

async function seedPublishedContent(
  t: ReturnType<typeof convexTest>,
  slug: string,
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: "demo-media",
      kind: "article",
      status: "published",
      slug,
      title: `Article ${slug}`,
      summary: "summary",
      category: "Analyses",
      tags: [],
      isPremium: false,
    }),
  );
}

async function seedPremiumEntitlement(
  t: ReturnType<typeof convexTest>,
  user: typeof MEMBER_USER,
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("entitlements", {
      tokenIdentifier: user.tokenIdentifier,
      clerkId: user.subject,
      isPro: true,
      source: "manual",
      updatedAt: Date.now(),
    });
  });
}

describe("personalLists authz", () => {
  it("rejects a guest on list and create", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.personalLists.queries.listMine, {}),
    ).rejects.toThrow(/Unauthenticated/);
    await expect(
      t.mutation(api.personalLists.mutations.create, { title: "Ma liste" }),
    ).rejects.toThrow(/Unauthenticated/);
  });

  it("lets a free signed-in member create one list", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(FREE_USER);

    const created = await asFree.mutation(api.personalLists.mutations.create, {
      title: "À lire",
    });
    expect(created.listId).toBeDefined();

    const lists = await asFree.query(api.personalLists.queries.listMine, {});
    expect(lists).toHaveLength(1);
    expect(lists[0].title).toBe("À lire");
  });

  it("blocks a free member from creating a second list", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(FREE_USER);

    await asFree.mutation(api.personalLists.mutations.create, {
      title: "Première",
    });

    await expect(
      asFree.mutation(api.personalLists.mutations.create, { title: "Deuxième" }),
    ).rejects.toThrow(/Premium required for additional lists/);

    const lists = await asFree.query(api.personalLists.queries.listMine, {});
    expect(lists).toHaveLength(1);
  });

  it("lets a premium member create multiple lists", async () => {
    const t = convexTest(schema, modules);
    await seedPremiumEntitlement(t, MEMBER_USER);
    const asMember = t.withIdentity(MEMBER_USER);

    await asMember.mutation(api.personalLists.mutations.create, {
      title: "Une",
    });
    await asMember.mutation(api.personalLists.mutations.create, {
      title: "Deux",
    });

    const lists = await asMember.query(api.personalLists.queries.listMine, {});
    expect(lists).toHaveLength(2);
  });

  it("only returns owned lists from getById", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(FREE_USER);
    const asOther = t.withIdentity(MEMBER_USER);

    const { listId } = await asFree.mutation(api.personalLists.mutations.create, {
      title: "Privée",
    });

    const mine = await asFree.query(api.personalLists.queries.getById, { listId });
    expect(mine.title).toBe("Privée");

    await expect(
      asOther.query(api.personalLists.queries.getById, { listId }),
    ).rejects.toThrow(/List not found/);
  });

  it("rename and delete are owner-only", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(FREE_USER);
    const asOther = t.withIdentity(MEMBER_USER);

    const { listId } = await asFree.mutation(api.personalLists.mutations.create, {
      title: "Avant",
    });

    await asFree.mutation(api.personalLists.mutations.rename, {
      listId,
      title: "Après",
    });

    const renamed = await asFree.query(api.personalLists.queries.getById, {
      listId,
    });
    expect(renamed.title).toBe("Après");

    await expect(
      asOther.mutation(api.personalLists.mutations.rename, {
        listId,
        title: "Hack",
      }),
    ).rejects.toThrow(/List not found/);

    await asFree.mutation(api.personalLists.mutations.remove, { listId });

    await expect(
      asFree.query(api.personalLists.queries.getById, { listId }),
    ).rejects.toThrow(/List not found/);
  });

  it("adds and removes items for the list owner", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(FREE_USER);
    const contentId = await seedPublishedContent(t, "list-item-a");

    const { listId } = await asFree.mutation(api.personalLists.mutations.create, {
      title: "Lecture",
    });

    const added = await asFree.mutation(api.personalLists.mutations.addItem, {
      listId,
      contentId,
    });
    expect(added.added).toBe(true);

    const withItems = await asFree.query(
      api.personalLists.queries.listWithItems,
      { listId },
    );
    expect(withItems.items).toHaveLength(1);
    expect(withItems.items[0].content._id).toBe(contentId);

    const duplicate = await asFree.mutation(api.personalLists.mutations.addItem, {
      listId,
      contentId,
    });
    expect(duplicate.added).toBe(false);

    const removed = await asFree.mutation(
      api.personalLists.mutations.removeItem,
      { listId, contentId },
    );
    expect(removed.removed).toBe(true);

    const empty = await asFree.query(api.personalLists.queries.listWithItems, {
      listId,
    });
    expect(empty.items).toHaveLength(0);
  });

  it("returns preview cover urls from the newest list items", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(FREE_USER);
    const contentA = await seedPublishedContent(t, "cover-a");
    const contentB = await seedPublishedContent(t, "cover-b");

    await t.run(async (ctx) => {
      await ctx.db.patch(contentA, {
        heroImageUrl: "https://example.com/cover-a.jpg",
      });
      await ctx.db.patch(contentB, {
        heroImageUrl: "https://example.com/cover-b.jpg",
      });
    });

    const { listId } = await asFree.mutation(api.personalLists.mutations.create, {
      title: "A lire",
    });
    await asFree.mutation(api.personalLists.mutations.addItem, {
      listId,
      contentId: contentA,
    });
    await asFree.mutation(api.personalLists.mutations.addItem, {
      listId,
      contentId: contentB,
    });

    const lists = await asFree.query(api.personalLists.queries.listMine, {});
    expect(lists[0].previewCoverUrls).toEqual([
      "https://example.com/cover-b.jpg",
      "https://example.com/cover-a.jpg",
    ]);
  });

  it("marks list membership for listMineForContent", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(FREE_USER);
    const contentA = await seedPublishedContent(t, "membership-a");
    const contentB = await seedPublishedContent(t, "membership-b");

    const { listId } = await asFree.mutation(api.personalLists.mutations.create, {
      title: "Mix",
    });
    await asFree.mutation(api.personalLists.mutations.addItem, {
      listId,
      contentId: contentA,
    });

    const lists = await asFree.query(
      api.personalLists.queries.listMineForContent,
      { contentId: contentA },
    );
    expect(lists[0].contains).toBe(true);

    const other = await asFree.query(
      api.personalLists.queries.listMineForContent,
      { contentId: contentB },
    );
    expect(other[0].contains).toBe(false);
  });

  it("cannot add items to another user's list", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(FREE_USER);
    const asOther = t.withIdentity(MEMBER_USER);
    const contentId = await seedPublishedContent(t, "list-item-b");

    const { listId } = await asFree.mutation(api.personalLists.mutations.create, {
      title: "Privée",
    });

    await expect(
      asOther.mutation(api.personalLists.mutations.addItem, {
        listId,
        contentId,
      }),
    ).rejects.toThrow(/List not found/);
  });
});

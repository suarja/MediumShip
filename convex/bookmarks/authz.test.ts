import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";

// Bookmarks are free for any signed-in account (roadmap: `bookmark = gratuit`),
// gated by `requireAuth`, NOT `requireMember`. These tests lock that rule: the
// regression they guard against is a signed-in non-member crashing on
// `Member access required` (the bug from removing a premium role).

const FREE_USER = { subject: "user_free", tokenIdentifier: "token_free" };
const MEMBER_USER = { subject: "user_pro", tokenIdentifier: "token_pro" };

async function seedPublishedContent(
  t: ReturnType<typeof convexTest>,
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: "demo-media",
      kind: "article",
      status: "published",
      slug: "free-read",
      title: "A free read",
      summary: "summary",
      category: "Analyses",
      tags: [],
      isPremium: false,
    }),
  );
}

describe("bookmarks authz", () => {
  it("rejects a guest on both read and write", async () => {
    const t = convexTest(schema, modules);
    const contentId = await seedPublishedContent(t);

    await expect(
      t.query(api.bookmarks.queries.listBookmarks, {}),
    ).rejects.toThrow(/Unauthenticated/);
    await expect(
      t.mutation(api.bookmarks.mutations.toggleBookmark, { contentId }),
    ).rejects.toThrow(/Unauthenticated/);
  });

  it("lets a signed-in non-member save and list bookmarks", async () => {
    const t = convexTest(schema, modules);
    const contentId = await seedPublishedContent(t);
    const asFree = t.withIdentity(FREE_USER);

    const toggled = await asFree.mutation(
      api.bookmarks.mutations.toggleBookmark,
      { contentId },
    );
    expect(toggled).toEqual({ bookmarked: true });

    const list = await asFree.query(api.bookmarks.queries.listBookmarks, {});
    expect(list).toHaveLength(1);
    expect(list[0].content._id).toBe(contentId);
  });

  it("toggles a bookmark back off on the second call", async () => {
    const t = convexTest(schema, modules);
    const contentId = await seedPublishedContent(t);
    const asFree = t.withIdentity(FREE_USER);

    await asFree.mutation(api.bookmarks.mutations.toggleBookmark, { contentId });
    const second = await asFree.mutation(
      api.bookmarks.mutations.toggleBookmark,
      { contentId },
    );
    expect(second).toEqual({ bookmarked: false });

    const list = await asFree.query(api.bookmarks.queries.listBookmarks, {});
    expect(list).toHaveLength(0);
  });

  it("still works for a member", async () => {
    const t = convexTest(schema, modules);
    const contentId = await seedPublishedContent(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("entitlements", {
        tokenIdentifier: MEMBER_USER.tokenIdentifier,
        clerkId: MEMBER_USER.subject,
        isPro: true,
        source: "manual",
        updatedAt: Date.now(),
      });
    });
    const asMember = t.withIdentity(MEMBER_USER);

    await asMember.mutation(api.bookmarks.mutations.toggleBookmark, {
      contentId,
    });
    const list = await asMember.query(api.bookmarks.queries.listBookmarks, {});
    expect(list).toHaveLength(1);
  });
});

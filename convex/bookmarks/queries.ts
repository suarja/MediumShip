import { query } from "../_generated/server";
import { requireMember } from "../entitlements/authz";

export const listBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const entitlement = await requireMember(ctx);
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier),
      )
      .order("desc")
      .take(100);

    const items = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const content = await ctx.db.get(bookmark.contentId);

        if (!content || content.status !== "published") {
          return null;
        }

        return {
          content,
          createdAt: bookmark.createdAt,
        };
      }),
    );

    return items.filter((item) => item !== null);
  },
});

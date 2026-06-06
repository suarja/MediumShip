import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";

export { getContentCoverImageUrl };

const PREVIEW_COVER_LIMIT = 3;

export async function resolveListPreviewCoverUrls(
  ctx: QueryCtx,
  listId: Id<"personalLists">,
): Promise<string[]> {
  const items = await ctx.db
    .query("personalListItems")
    .withIndex("by_listId_and_position", (q) => q.eq("listId", listId))
    .order("desc")
    .take(PREVIEW_COVER_LIMIT);

  const urls: string[] = [];

  for (const item of items) {
    const content = await ctx.db.get(item.contentId);
    if (!content || content.status !== "published") {
      continue;
    }

    const url = getContentCoverImageUrl(content);
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

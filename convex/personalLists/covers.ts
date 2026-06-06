import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { extractYoutubeVideoId } from "../youtube/helpers";

const PREVIEW_COVER_LIMIT = 3;

export function getContentCoverImageUrl(
  content: Pick<Doc<"contents">, "heroImageUrl" | "kind" | "videoSource">,
): string | undefined {
  if (content.heroImageUrl) {
    return content.heroImageUrl;
  }

  if (content.kind === "video" && content.videoSource?.kind === "youtube") {
    const youtubeVideoId =
      content.videoSource.youtubeVideoId ||
      extractYoutubeVideoId(content.videoSource.youtubeUrl);

    if (youtubeVideoId) {
      return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
    }
  }

  return undefined;
}

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

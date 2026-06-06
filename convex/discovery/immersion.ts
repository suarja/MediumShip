import { v } from "convex/values";

import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalMutation } from "../_generated/server";
import { fetchWikipediaArticleBody } from "./providers/wikipedia";

export const patchArticleBody = internalMutation({
  args: {
    contentId: v.id("contents"),
    articleBody: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { contentId, articleBody }) => {
    const content = await ctx.db.get(contentId);
    if (!content || content.status !== "published") {
      return null;
    }

    await ctx.db.patch(contentId, { articleBody });
    return null;
  },
});

const fetchResultValidator = v.object({
  articleBody: v.string(),
  fetched: v.boolean(),
});

export const fetchArticleBody = action({
  args: {
    contentId: v.id("contents"),
  },
  returns: fetchResultValidator,
  handler: async (ctx, { contentId }) => {
    const content = await ctx.runQuery(api.content.queries.getPublishedById, {
      id: contentId,
    });

    if (!content) {
      return { articleBody: "", fetched: false };
    }

    const cachedBody = content.articleBody?.trim();
    if (cachedBody) {
      return { articleBody: cachedBody, fetched: false };
    }

    if (content.source !== "wikipedia" || !content.externalId) {
      return { articleBody: "", fetched: false };
    }

    try {
      const articleBody = await fetchWikipediaArticleBody(content.externalId);
      if (!articleBody) {
        return { articleBody: "", fetched: false };
      }

      await ctx.runMutation(internal.discovery.immersion.patchArticleBody, {
        contentId: contentId as Id<"contents">,
        articleBody,
      });

      return { articleBody, fetched: true };
    } catch {
      return { articleBody: "", fetched: false };
    }
  },
});

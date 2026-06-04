"use node";

import { v } from "convex/values";
import { YouTubeMetadataCache } from "convex-youtube-cache";

import { api, components } from "../_generated/api";
import { action } from "../_generated/server";
import { extractYoutubeVideoId, parseDurationSeconds } from "./helpers";

function getEnv(name: string) {
  return (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.[name];
}

export const enrichFromYoutube = action({
  args: { youtubeUrl: v.string() },
  handler: async (ctx, { youtubeUrl }) => {
    const viewer = await ctx.runQuery(api.cms.queries.getViewer, {});
    if (!viewer.isAuthenticated) {
      throw new Error("Unauthenticated");
    }
    if (!viewer.isAdmin) {
      throw new Error("Forbidden");
    }

    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      return { enriched: false as const, reason: "not-a-youtube-url" as const };
    }

    const apiKey = getEnv("YOUTUBE_DATA_API_KEY");
    if (!apiKey) {
      return { enriched: false as const, reason: "missing-api-key" as const };
    }

    const cache = new YouTubeMetadataCache(components.youtubeMetadata, { apiKey });
    const data = await cache.getVideo(ctx, { videoId });
    if (!data) {
      return { enriched: false as const, reason: "not-found-or-quota" as const };
    }

    return {
      enriched: true as const,
      title: data.title,
      durationSeconds: data.duration ? parseDurationSeconds(data.duration) : 0,
      thumbnailUrl: data.thumbnailUrl,
      youtubeVideoId: videoId,
    };
  },
});

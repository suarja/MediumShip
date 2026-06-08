import { internal } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";
import { parseDurationSeconds } from "../../youtube/helpers";
import type { FetchDemand } from "../fetchDemand";
import type { ContentProvider } from "../provider";
import { normalizeScoringKey } from "../scoring";

export const MAX_YOUTUBE_TAGS_PER_ITEM = 8;

export type YouTubeThumbnailSet = {
  maxres?: { url: string };
  high?: { url: string };
  medium?: { url: string };
  default?: { url: string };
};

export type YouTubeVideoRaw = {
  videoId: string;
  title: string;
  description: string;
  duration: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  tags?: string[];
  categoryId?: string;
  thumbnails?: YouTubeThumbnailSet;
};

export type ResolvedYouTubeChannel = {
  channelId: string;
  defaultCategory?: string;
};

export type WhitelistChannelEntry = {
  channelId: string;
  defaultCategory: string;
};

export type NormalizedYouTubeVideo = {
  tenantSlug: string;
  kind: "video";
  status: "published";
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  isPremium: false;
  heroImageUrl?: string;
  /** YouTube channel name, surfaced as the attribution on the video detail. */
  author?: string;
  publishedAt: string;
  durationSeconds: number;
  videoSource: {
    kind: "youtube";
    youtubeVideoId: string;
    youtubeUrl: string;
  };
  source: "youtube";
  externalId: string;
  canonicalUrl: string;
};

const METADATA_BATCH_SIZE = 50;
const PLAYLIST_PAGE_SIZE = 50;
const DEFAULT_PLAYLIST_MAX_PAGES = 3;

/**
 * Floor (seconds) under which a video is treated as a Short and skipped — the
 * discovery feed is built around full segments, not vertical Shorts/teasers.
 */
export const MIN_VIDEO_DURATION_SECONDS = 60;

function getEnv(name: string): string | undefined {
  return (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.[name];
}

export function uploadsPlaylistId(channelId: string): string {
  return `UU${channelId.slice(2)}`;
}

export function buildYouTubeSlug(title: string, videoId: string): string {
  const base = normalizeScoringKey(title).slice(0, 40);
  const prefix = base.length > 0 ? base : "video";
  return `${prefix}-${videoId.slice(0, 6)}`;
}

export function truncateSummary(description: string, maxChars = 300): string {
  const paragraphs = description
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const firstParagraph = paragraphs[0] ?? description.replace(/\s+/g, " ").trim();
  if (firstParagraph.length <= maxChars) {
    return firstParagraph;
  }

  return `${firstParagraph.slice(0, maxChars - 1).trimEnd()}…`;
}

export function extractYouTubeTags(
  rawTags: string[] | undefined,
  maxTags = MAX_YOUTUBE_TAGS_PER_ITEM,
): string[] {
  if (!rawTags?.length) {
    return [];
  }

  const tags: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of rawTags) {
    const tag = normalizeScoringKey(rawTag);
    if (!tag || tag.length < 3 || seen.has(tag)) {
      continue;
    }

    seen.add(tag);
    tags.push(tag);
    if (tags.length >= maxTags) {
      break;
    }
  }

  return tags;
}

export function resolveHeroImageUrl(
  thumbnails?: YouTubeThumbnailSet,
): string | undefined {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url
  );
}

export function resolveChannelIds(
  providerConfig: Record<string, unknown> | null,
  whitelistChannels: ReadonlyArray<WhitelistChannelEntry>,
): ResolvedYouTubeChannel[] {
  const channels: ResolvedYouTubeChannel[] = [];
  const seen = new Set<string>();
  const disableWhitelist = providerConfig?.disableWhitelist === true;

  if (!disableWhitelist) {
    for (const entry of whitelistChannels) {
      if (seen.has(entry.channelId)) {
        continue;
      }
      seen.add(entry.channelId);
      channels.push({
        channelId: entry.channelId,
        defaultCategory: entry.defaultCategory,
      });
    }
  }

  const tenantChannelId =
    typeof providerConfig?.channelId === "string"
      ? providerConfig.channelId.trim()
      : "";
  if (tenantChannelId.length > 0 && !seen.has(tenantChannelId)) {
    seen.add(tenantChannelId);
    const defaultCategory =
      typeof providerConfig?.defaultCategory === "string"
        ? providerConfig.defaultCategory.trim()
        : undefined;
    channels.push({
      channelId: tenantChannelId,
      defaultCategory: defaultCategory || undefined,
    });
  }

  return channels;
}

export function normalizeYouTubeVideo(
  raw: YouTubeVideoRaw,
  args: {
    tenantSlug: string;
    channel: ResolvedYouTubeChannel;
  },
): NormalizedYouTubeVideo {
  const tags = extractYouTubeTags(raw.tags);
  const category =
    tags[0] ??
    args.channel.defaultCategory ??
    normalizeScoringKey(raw.channelTitle);
  const youtubeUrl = `https://youtube.com/watch?v=${raw.videoId}`;

  return {
    tenantSlug: args.tenantSlug,
    kind: "video",
    status: "published",
    slug: buildYouTubeSlug(raw.title, raw.videoId),
    title: raw.title.trim(),
    summary: truncateSummary(raw.description),
    category,
    tags,
    isPremium: false,
    heroImageUrl: resolveHeroImageUrl(raw.thumbnails),
    author: raw.channelTitle.trim() || undefined,
    publishedAt: raw.publishedAt,
    durationSeconds: raw.duration ? parseDurationSeconds(raw.duration) : 0,
    videoSource: {
      kind: "youtube",
      youtubeVideoId: raw.videoId,
      youtubeUrl,
    },
    source: "youtube",
    externalId: raw.videoId,
    canonicalUrl: youtubeUrl,
  };
}

type YouTubeVideosListItem = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelId?: string;
    channelTitle?: string;
    tags?: string[];
    categoryId?: string;
    thumbnails?: YouTubeThumbnailSet;
  };
  contentDetails?: {
    duration?: string;
  };
  status?: {
    embeddable?: boolean;
  };
};

export function parseYouTubeVideosListResponse(
  payload: { items?: YouTubeVideosListItem[] },
): YouTubeVideoRaw[] {
  const videos: YouTubeVideoRaw[] = [];

  for (const item of payload.items ?? []) {
    const videoId = item.id;
    const snippet = item.snippet;
    const duration = item.contentDetails?.duration;
    if (!videoId || !snippet?.title || !duration) {
      continue;
    }

    // Channels can disable off-site playback; ingesting those yields a video
    // that only fails when the user tries to play it. Drop them at the source.
    if (item.status?.embeddable === false) {
      continue;
    }

    // Skip Shorts/teasers — the discovery feed is built around full segments.
    if (parseDurationSeconds(duration) < MIN_VIDEO_DURATION_SECONDS) {
      continue;
    }

    videos.push({
      videoId,
      title: snippet.title,
      description: snippet.description ?? "",
      duration,
      channelId: snippet.channelId ?? "",
      channelTitle: snippet.channelTitle ?? "",
      publishedAt: snippet.publishedAt ?? new Date().toISOString(),
      tags: snippet.tags,
      categoryId: snippet.categoryId,
      thumbnails: snippet.thumbnails,
    });
  }

  return videos;
}

export async function fetchPlaylistVideoIds(
  playlistId: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  options: {
    maxPages?: number;
    knownIngestedIds?: ReadonlySet<string>;
  } = {},
): Promise<string[]> {
  const maxPages = options.maxPages ?? DEFAULT_PLAYLIST_MAX_PAGES;
  const knownIngestedIds = options.knownIngestedIds ?? new Set<string>();
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", String(PLAYLIST_PAGE_SIZE));
    url.searchParams.set("key", apiKey);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetchImpl(url.toString());
    if (!response.ok) {
      break;
    }

    const payload = (await response.json()) as {
      items?: Array<{
        contentDetails?: {
          videoId?: string;
        };
      }>;
      nextPageToken?: string;
    };

    for (const item of payload.items ?? []) {
      const videoId = item.contentDetails?.videoId;
      if (!videoId) {
        continue;
      }
      if (knownIngestedIds.has(videoId)) {
        return videoIds;
      }
      videoIds.push(videoId);
    }

    pageToken = payload.nextPageToken;
    if (!pageToken) {
      break;
    }
  }

  return videoIds;
}

export async function batchFetchVideoMetadata(
  videoIds: string[],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouTubeVideoRaw[]> {
  const results: YouTubeVideoRaw[] = [];

  for (let index = 0; index < videoIds.length; index += METADATA_BATCH_SIZE) {
    const batch = videoIds.slice(index, index + METADATA_BATCH_SIZE);
    const url =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=snippet,contentDetails,status` +
      `&id=${encodeURIComponent(batch.join(","))}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const response = await fetchImpl(url);
    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as { items?: YouTubeVideosListItem[] };
    results.push(...parseYouTubeVideosListResponse(payload));
  }

  return results;
}

export async function ingestYouTubeDemand(
  ctx: ActionCtx,
  args: {
    tenantSlug: string;
    demand: FetchDemand;
  },
  deps: {
    fetchImpl?: typeof fetch;
    apiKey?: string;
  } = {},
): Promise<{ upserted: number }> {
  void args.demand;

  const providerConfig = await ctx.runQuery(
    internal.discovery.providerConfig.getTenantProviderConfig,
    {
      tenantSlug: args.tenantSlug,
      source: "youtube",
    },
  );

  // The whitelist is the set of enabled channels across locales; locale is only
  // an organizational label in the CMS, not an ingestion filter.
  const disableWhitelist = providerConfig?.disableWhitelist === true;
  const whitelistChannels = disableWhitelist
    ? []
    : await ctx.runQuery(
        internal.discovery.youtubeWhitelistChannels.listWhitelistChannels,
        {},
      );
  const channels = resolveChannelIds(providerConfig, whitelistChannels);
  if (channels.length === 0) {
    return { upserted: 0 };
  }

  const apiKey = deps.apiKey ?? getEnv("YOUTUBE_DATA_API_KEY");
  if (!apiKey) {
    return { upserted: 0 };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const knownIngestedIds = new Set<string>(
    await ctx.runQuery(internal.discovery.ingest.listIngestedExternalIds, {
      tenantSlug: args.tenantSlug,
      source: "youtube",
    }),
  );

  const normalized: NormalizedYouTubeVideo[] = [];

  for (const channel of channels) {
    const playlistId = uploadsPlaylistId(channel.channelId);

    let videoIds: string[] = [];
    try {
      videoIds = await fetchPlaylistVideoIds(playlistId, apiKey, fetchImpl, {
        knownIngestedIds,
      });
    } catch {
      continue;
    }

    if (videoIds.length === 0) {
      continue;
    }

    const novelVideoIds: string[] = await ctx.runQuery(
      internal.discovery.ingest.filterNewExternalIds,
      {
        tenantSlug: args.tenantSlug,
        source: "youtube",
        externalIds: videoIds,
      },
    );

    if (novelVideoIds.length === 0) {
      continue;
    }

    let metadata: YouTubeVideoRaw[] = [];
    try {
      metadata = await batchFetchVideoMetadata(novelVideoIds, apiKey, fetchImpl);
    } catch {
      continue;
    }

    for (const raw of metadata) {
      normalized.push(
        normalizeYouTubeVideo(raw, {
          tenantSlug: args.tenantSlug,
          channel,
        }),
      );
      knownIngestedIds.add(raw.videoId);
    }
  }

  if (normalized.length === 0) {
    return { upserted: 0 };
  }

  const result: { upserted: number } = await ctx.runMutation(
    internal.discovery.ingest.upsertIngested,
    { items: normalized },
  );

  return { upserted: result.upserted };
}

export const youtubeProvider: ContentProvider = {
  source: "youtube",
  async ingest(ctx, args) {
    return ingestYouTubeDemand(ctx, args);
  },
};

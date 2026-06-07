/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api, internal } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../../convexTestModules";
import { PROVIDERS } from "../provider";
import { YOUTUBE_WHITELIST_FR } from "./youtubeWhitelist";
import {
  batchFetchVideoMetadata,
  buildYouTubeSlug,
  extractYouTubeTags,
  fetchPlaylistVideoIds,
  ingestYouTubeDemand,
  normalizeYouTubeVideo,
  parseYouTubeVideosListResponse,
  resolveChannelIds,
  resolveHeroImageUrl,
  truncateSummary,
  uploadsPlaylistId,
  youtubeProvider,
  type YouTubeVideoRaw,
} from "./youtube";

const TENANT = "demo-media";
const API_KEY = "test-api-key";
const CHANNEL_ID = "UCaNlbnghtwlsGF-KzAFThqA";
const UPLOADS_PLAYLIST = "UUaNlbnghtwlsGF-KzAFThqA";

const SAMPLE_VIDEO: YouTubeVideoRaw = {
  videoId: "abc123XYZ9",
  title: "Quantum Entanglement Explained",
  description: "First paragraph about quantum physics.\n\nSecond paragraph.",
  duration: "PT5M12S",
  channelId: CHANNEL_ID,
  channelTitle: "Science étonnante",
  publishedAt: "2024-01-15T10:00:00Z",
  tags: ["Quantum Physics", "Science", "AI"],
  thumbnails: {
    maxres: { url: "https://i.ytimg.com/vi/abc123XYZ9/maxresdefault.jpg" },
    high: { url: "https://i.ytimg.com/vi/abc123XYZ9/hqdefault.jpg" },
  },
};

const HISTORY_CHANNEL_VIDEO: YouTubeVideoRaw = {
  ...SAMPLE_VIDEO,
  videoId: "hist001XYZ",
  title: "L Intelligence Artificielle dans l Histoire",
  tags: ["Intelligence Artificielle", "Technologie", "Histoire"],
  channelTitle: "Nota Bene",
  thumbnails: {
    high: { url: "https://i.ytimg.com/vi/hist001XYZ/hqdefault.jpg" },
  },
};

function makeIngestCtx(t: ReturnType<typeof convexTest>) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runQuery: (ref: any, args: any) => t.query(ref, args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runMutation: (ref: any, args: any) => t.mutation(ref, args),
  } as never;
}

function videosListPayload(video: YouTubeVideoRaw) {
  return {
    items: [
      {
        id: video.videoId,
        snippet: {
          title: video.title,
          description: video.description,
          publishedAt: video.publishedAt,
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          tags: video.tags,
          categoryId: video.categoryId,
          thumbnails: video.thumbnails,
        },
        contentDetails: {
          duration: video.duration,
        },
      },
    ],
  };
}

describe("uploadsPlaylistId", () => {
  it("derives uploads playlist id from channel id without network", () => {
    expect(uploadsPlaylistId(CHANNEL_ID)).toBe(UPLOADS_PLAYLIST);
    expect(uploadsPlaylistId("UC1234567890abcdefghij")).toBe(
      "UU1234567890abcdefghij",
    );
  });
});

describe("extractYouTubeTags", () => {
  it("normalizes, deduplicates, filters short tags, and caps at 8", () => {
    const tags = extractYouTubeTags([
      "Quantum Physics",
      "quantum physics",
      "AI",
      "ok",
      "Science",
      "Tech",
      "History",
      "Geo",
      "Bio",
      "Chem",
      "Math",
    ]);

    expect(tags).toEqual([
      "quantum-physics",
      "science",
      "tech",
      "history",
      "geo",
      "bio",
      "chem",
      "math",
    ]);
    expect(tags).not.toContain("ai");
    expect(tags).not.toContain("ok");
  });
});

describe("buildYouTubeSlug", () => {
  it("combines normalized title prefix with video id suffix", () => {
    expect(buildYouTubeSlug("Quantum Entanglement Explained", "abc123XYZ9")).toBe(
      "quantum-entanglement-explained-abc123",
    );
  });
});

describe("truncateSummary", () => {
  it("uses the first non-empty paragraph", () => {
    expect(truncateSummary(SAMPLE_VIDEO.description)).toBe(
      "First paragraph about quantum physics.",
    );
  });

  it("truncates long paragraphs with an ellipsis suffix", () => {
    const long = "A".repeat(350);
    expect(truncateSummary(long)).toHaveLength(300);
    expect(truncateSummary(long).endsWith("…")).toBe(true);
  });
});

describe("resolveHeroImageUrl", () => {
  it("prefers maxres then high then medium then default", () => {
    expect(resolveHeroImageUrl(SAMPLE_VIDEO.thumbnails)).toBe(
      "https://i.ytimg.com/vi/abc123XYZ9/maxresdefault.jpg",
    );
    expect(resolveHeroImageUrl(HISTORY_CHANNEL_VIDEO.thumbnails)).toBe(
      "https://i.ytimg.com/vi/hist001XYZ/hqdefault.jpg",
    );
  });
});

describe("resolveChannelIds", () => {
  it("merges whitelist channels for the locale when whitelist is enabled", () => {
    const ids = resolveChannelIds(null, "fr").map((channel) => channel.channelId);

    expect(ids).toEqual(YOUTUBE_WHITELIST_FR.map((entry) => entry.channelId));
  });

  it("adds tenant channelId and deduplicates", () => {
    const duplicateId = YOUTUBE_WHITELIST_FR[0]!.channelId;
    const channels = resolveChannelIds(
      { channelId: duplicateId, defaultCategory: "creator" },
      "fr",
    );

    expect(channels.filter((channel) => channel.channelId === duplicateId)).toHaveLength(1);
  });

  it("honors disableWhitelist and keeps only tenant channel", () => {
    const channels = resolveChannelIds(
      {
        disableWhitelist: true,
        channelId: "UCcreator123",
        defaultCategory: "tech",
      },
      "fr",
    );

    expect(channels).toEqual([
      { channelId: "UCcreator123", defaultCategory: "tech" },
    ]);
  });

  it("returns empty when whitelist disabled and no tenant channel", () => {
    expect(resolveChannelIds({ disableWhitelist: true }, "fr")).toEqual([]);
  });
});

describe("normalizeYouTubeVideo", () => {
  it("uses per-video tags for category and personalization signal", () => {
    const normalized = normalizeYouTubeVideo(SAMPLE_VIDEO, {
      tenantSlug: TENANT,
      channel: { channelId: CHANNEL_ID, defaultCategory: "science" },
    });

    expect(normalized).toMatchObject({
      tenantSlug: TENANT,
      kind: "video",
      status: "published",
      source: "youtube",
      externalId: "abc123XYZ9",
      canonicalUrl: "https://youtube.com/watch?v=abc123XYZ9",
      title: "Quantum Entanglement Explained",
      summary: "First paragraph about quantum physics.",
      category: "quantum-physics",
      tags: ["quantum-physics", "science"],
      isPremium: false,
      durationSeconds: 312,
      heroImageUrl: "https://i.ytimg.com/vi/abc123XYZ9/maxresdefault.jpg",
      videoSource: {
        kind: "youtube",
        youtubeVideoId: "abc123XYZ9",
        youtubeUrl: "https://youtube.com/watch?v=abc123XYZ9",
      },
    });
    expect(normalized.slug).toBe("quantum-entanglement-explained-abc123");
    expect(normalized.publishedAt).toBe("2024-01-15T10:00:00Z");
  });

  it("classifies an AI video on a history channel by its own tags, not channel default", () => {
    const normalized = normalizeYouTubeVideo(HISTORY_CHANNEL_VIDEO, {
      tenantSlug: TENANT,
      channel: { channelId: "UCP46_MXP_WG_auH88FnfS1A", defaultCategory: "histoire" },
    });

    expect(normalized.category).toBe("intelligence-artificielle");
    expect(normalized.tags).toEqual([
      "intelligence-artificielle",
      "technologie",
      "histoire",
    ]);
    expect(normalized.category).not.toBe("histoire");
  });

  it("falls back to whitelist defaultCategory when video has no tags", () => {
    const normalized = normalizeYouTubeVideo(
      { ...SAMPLE_VIDEO, tags: undefined },
      {
        tenantSlug: TENANT,
        channel: { channelId: CHANNEL_ID, defaultCategory: "science" },
      },
    );

    expect(normalized.category).toBe("science");
    expect(normalized.tags).toEqual([]);
  });
});

describe("parseYouTubeVideosListResponse", () => {
  it("maps snippet and contentDetails into YouTubeVideoRaw", () => {
    const parsed = parseYouTubeVideosListResponse(videosListPayload(SAMPLE_VIDEO));

    expect(parsed).toEqual([SAMPLE_VIDEO]);
  });
});

describe("fetchPlaylistVideoIds", () => {
  it("paginates playlistItems.list up to maxPages", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const params = new URL(url).searchParams;
      const pageToken = params.get("pageToken");

      if (!pageToken) {
        return {
          ok: true,
          json: async () => ({
            items: [{ contentDetails: { videoId: "vid-1" } }],
            nextPageToken: "page-2",
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          items: [{ contentDetails: { videoId: "vid-2" } }],
        }),
      };
    });

    const videoIds = await fetchPlaylistVideoIds(
      UPLOADS_PLAYLIST,
      API_KEY,
      fetchMock as unknown as typeof fetch,
      { maxPages: 2 },
    );

    expect(videoIds).toEqual(["vid-1", "vid-2"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops paginating when an already-ingested video id is encountered", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const params = new URL(url).searchParams;
      const pageToken = params.get("pageToken");

      if (!pageToken) {
        return {
          ok: true,
          json: async () => ({
            items: [
              { contentDetails: { videoId: "vid-new" } },
              { contentDetails: { videoId: "vid-known" } },
            ],
            nextPageToken: "page-2",
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          items: [{ contentDetails: { videoId: "vid-should-not-fetch" } }],
        }),
      };
    });

    const videoIds = await fetchPlaylistVideoIds(
      UPLOADS_PLAYLIST,
      API_KEY,
      fetchMock as unknown as typeof fetch,
      { knownIngestedIds: new Set(["vid-known"]) },
    );

    expect(videoIds).toEqual(["vid-new"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("batchFetchVideoMetadata", () => {
  it("batches videos.list calls in groups of 50", async () => {
    const videoIds = Array.from({ length: 55 }, (_, index) => `vid-${index}`);
    const fetchMock = vi.fn(async (url: string) => {
      const params = new URL(url).searchParams;
      const ids = params.get("id")?.split(",") ?? [];

      return {
        ok: true,
        json: async () => ({
          items: ids.map((videoId) => ({
            id: videoId,
            snippet: {
              title: `Title ${videoId}`,
              description: "Description",
              publishedAt: "2024-01-01T00:00:00Z",
              channelId: CHANNEL_ID,
              channelTitle: "Channel",
              tags: ["Science"],
              thumbnails: {
                high: { url: `https://example.com/${videoId}.jpg` },
              },
            },
            contentDetails: { duration: "PT1M" },
          })),
        }),
      };
    });

    const results = await batchFetchVideoMetadata(
      videoIds,
      API_KEY,
      fetchMock as unknown as typeof fetch,
    );

    expect(results).toHaveLength(55);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[0]![0] as string).searchParams.get("id")).toContain(
      "vid-0",
    );
    expect(
      new URL(fetchMock.mock.calls[1]![0] as string).searchParams.get("id")?.split(","),
    ).toHaveLength(5);
  });
});

describe("filterNewExternalIds", () => {
  it("returns only external ids absent from contents", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "video",
        status: "published",
        slug: "existing-video",
        title: "Existing",
        summary: "Already ingested",
        category: "science",
        tags: ["science"],
        isPremium: false,
        source: "youtube",
        externalId: "known-id",
        canonicalUrl: "https://youtube.com/watch?v=known-id",
      });
    });

    const novel = await t.query(internal.discovery.ingest.filterNewExternalIds, {
      tenantSlug: TENANT,
      source: "youtube",
      externalIds: ["known-id", "new-id"],
    });

    expect(novel).toEqual(["new-id"]);
  });
});

describe("youtubeProvider.ingest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns upserted 0 without fetch when whitelist disabled and no tenant channel", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          youtube: { disableWhitelist: true },
        },
      });
    });

    const fetchMock = vi.fn();
    const ctx = makeIngestCtx(t);
    const result = await ingestYouTubeDemand(
      ctx,
      { tenantSlug: TENANT, demand: { categories: ["science"] } },
      { fetchImpl: fetchMock as unknown as typeof fetch, apiKey: API_KEY },
    );

    expect(result).toEqual({ upserted: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ingests via playlist + videos.list without tenant youtube config", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          youtube: { disableWhitelist: true, channelId: CHANNEL_ID },
        },
      });
    });

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("playlistItems")) {
        return {
          ok: true,
          json: async () => ({
            items: [{ contentDetails: { videoId: "abc123XYZ9" } }],
          }),
        };
      }

      if (url.includes("/videos")) {
        return {
          ok: true,
          json: async () => videosListPayload(SAMPLE_VIDEO),
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const ctx = makeIngestCtx(t);
    const result = await ingestYouTubeDemand(
      ctx,
      { tenantSlug: TENANT, demand: { categories: [] } },
      { fetchImpl: fetchMock as unknown as typeof fetch, apiKey: API_KEY },
    );

    expect(result.upserted).toBe(1);
    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/videos"))).toBe(
      true,
    );
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("channels"))).toBe(
      false,
    );

    const rows = await t.run(async (db) =>
      db.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q.eq("tenantSlug", TENANT).eq("source", "youtube"),
        )
        .collect(),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      kind: "video",
      source: "youtube",
      durationSeconds: 312,
      category: "quantum-physics",
      tags: ["quantum-physics", "science"],
      videoSource: { kind: "youtube", youtubeVideoId: "abc123XYZ9" },
    });
  });

  it("deduplicates on re-run via filterNewExternalIds and upsertIngested", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          youtube: { disableWhitelist: true, channelId: CHANNEL_ID },
        },
      });
    });

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("playlistItems")) {
        return {
          ok: true,
          json: async () => ({
            items: [{ contentDetails: { videoId: "abc123XYZ9" } }],
          }),
        };
      }

      return {
        ok: true,
        json: async () => videosListPayload(SAMPLE_VIDEO),
      };
    });

    const deps = {
      fetchImpl: fetchMock as unknown as typeof fetch,
      apiKey: API_KEY,
    };
    const ctx = makeIngestCtx(t);

    const first = await ingestYouTubeDemand(
      ctx,
      { tenantSlug: TENANT, demand: { categories: [] } },
      deps,
    );
    const second = await ingestYouTubeDemand(
      ctx,
      { tenantSlug: TENANT, demand: { categories: [] } },
      deps,
    );

    expect(first.upserted).toBe(1);
    expect(second.upserted).toBe(0);

    const videosListCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/videos"),
    );
    expect(videosListCalls).toHaveLength(1);
  });

  it("returns upserted 0 when api key is missing", async () => {
    const t = convexTest(schema, modules);
    const fetchMock = vi.fn();
    const ctx = makeIngestCtx(t);

    const result = await ingestYouTubeDemand(
      ctx,
      { tenantSlug: TENANT, demand: { categories: [] } },
      { fetchImpl: fetchMock as unknown as typeof fetch, apiKey: undefined },
    );

    expect(result).toEqual({ upserted: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("source isolation", () => {
  it("excludes youtube from listPublishedFeed and includes it in getDiscoveryFeed", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover", "articles"],
      });
      await ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "article",
        status: "published",
        slug: "cms-story",
        title: "CMS story",
        summary: "Editorial",
        category: "Analyses",
        tags: [],
        isPremium: false,
        source: "cms",
      });
      await ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "video",
        status: "published",
        slug: "youtube-story-abc123",
        title: "YouTube story",
        summary: "Discovery video",
        category: "tech",
        tags: ["tech", "ai"],
        isPremium: false,
        source: "youtube",
        externalId: "abc123XYZ9",
        canonicalUrl: "https://youtube.com/watch?v=abc123XYZ9",
        durationSeconds: 312,
        videoSource: {
          kind: "youtube",
          youtubeVideoId: "abc123XYZ9",
          youtubeUrl: "https://youtube.com/watch?v=abc123XYZ9",
        },
      });
    });

    const editorial = await t.query(api.content.queries.listPublishedFeed, {
      tenantSlug: TENANT,
    });
    const discovery = await t.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
    });

    expect(editorial.map((item) => item.title)).toEqual(["CMS story"]);
    expect(discovery.items.map((item) => item.title).sort()).toEqual(
      ["CMS story", "YouTube story"].sort(),
    );
  });
});

describe("PROVIDERS registration", () => {
  it("includes youtubeProvider alongside existing adapters", () => {
    expect(PROVIDERS.map((provider) => provider.source)).toEqual([
      "cms",
      "wikipedia",
      "rss",
      "youtube",
    ]);
  });
});

describe("upsertIngested youtube source", () => {
  it("accepts youtube video items with videoSource and durationSeconds", async () => {
    const t = convexTest(schema, modules);
    const item = normalizeYouTubeVideo(SAMPLE_VIDEO, {
      tenantSlug: TENANT,
      channel: { channelId: CHANNEL_ID, defaultCategory: "science" },
    });

    const result: { upserted: number } = await t.mutation(
      internal.discovery.ingest.upsertIngested,
      { items: [item] },
    );

    expect(result.upserted).toBe(1);

    const row = await t.run(async (ctx) =>
      ctx.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q
            .eq("tenantSlug", TENANT)
            .eq("source", "youtube")
            .eq("externalId", "abc123XYZ9"),
        )
        .unique(),
    );

    expect(row?.durationSeconds).toBe(312);
    expect(row?.videoSource).toEqual({
      kind: "youtube",
      youtubeVideoId: "abc123XYZ9",
      youtubeUrl: "https://youtube.com/watch?v=abc123XYZ9",
    });
  });
});

describe("youtubeProvider export", () => {
  it("exposes source youtube", () => {
    expect(youtubeProvider.source).toBe("youtube");
  });
});

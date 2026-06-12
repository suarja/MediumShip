import { v } from "convex/values";

import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalMutation } from "../_generated/server";
import { syncContentInsert } from "../categories/aggregate";
import {
  decodeXmlEntities,
  firstTagContent,
  splitFeedBlocks,
} from "../discovery/providers/rss";
import { normalizeScoringKey } from "../discovery/scoring";
import { defaultTenant } from "../../src/features/tenant/default-tenant";

const PODCAST_USER_AGENT = "MediumShip/1.0 (CMS podcast import)";
const MAX_EPISODES = 30;
const DEFAULT_EPISODE_CATEGORY = "Podcast";

export type ParsedPodcastEpisode = {
  title: string;
  audioUrl: string;
  guid: string;
  canonicalUrl: string;
  summary: string;
  durationSeconds?: number;
  imageUrl?: string;
  publishedAt?: string;
};

function enclosureAudioUrl(block: string): string | undefined {
  const match = block.match(/<enclosure\b[^>]*\burl=["']([^"']+)["'][^>]*>/i);
  if (!match) {
    return undefined;
  }
  const type = match[0].match(/\btype=["']([^"']+)["']/i);
  // Accept when no type is declared; reject explicitly non-audio enclosures.
  if (type && !/^audio\//i.test(type[1])) {
    return undefined;
  }
  return decodeXmlEntities(match[1]);
}

function episodeImageUrl(block: string): string | undefined {
  const match = block.match(/<itunes:image\b[^>]*\bhref=["']([^"']+)["']/i);
  return match ? decodeXmlEntities(match[1]) : undefined;
}

/** Parses "3600", "12:34" or "1:02:03" into seconds. */
export function parseItunesDuration(raw: string | undefined): number | undefined {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.length === 0 || parts.some((part) => Number.isNaN(part))) {
    return undefined;
  }
  return parts.reduce((acc, part) => acc * 60 + part, 0);
}

/** Extracts audio episodes (those with an audio enclosure) from a podcast feed. */
export function parsePodcastFeed(xml: string): ParsedPodcastEpisode[] {
  const episodes: ParsedPodcastEpisode[] = [];

  for (const block of splitFeedBlocks(xml)) {
    const audioUrl = enclosureAudioUrl(block);
    const title = firstTagContent(block, ["title"]);
    if (!audioUrl || !title) {
      continue;
    }

    const guid = firstTagContent(block, ["guid", "id"]) ?? audioUrl;
    const link = firstTagContent(block, ["link"]) ?? "";
    const summary =
      firstTagContent(block, ["description", "summary", "itunes:summary"]) ?? "";
    const durationSeconds = parseItunesDuration(
      firstTagContent(block, ["itunes:duration", "duration"]),
    );

    episodes.push({
      title,
      audioUrl,
      guid,
      canonicalUrl: link || audioUrl,
      summary,
      durationSeconds,
      imageUrl: episodeImageUrl(block),
      publishedAt: firstTagContent(block, ["pubDate", "published", "updated"]),
    });

    if (episodes.length >= MAX_EPISODES) {
      break;
    }
  }

  return episodes;
}

function buildEpisodeSlug(title: string, guid: string): string {
  const base = normalizeScoringKey(title).slice(0, 50) || "episode";
  let hash = 0;
  for (let i = 0; i < guid.length; i += 1) {
    hash = (hash * 31 + guid.charCodeAt(i)) >>> 0;
  }
  return `rss-${base}-${hash.toString(36).slice(0, 6).padStart(6, "0")}`;
}

/** Idempotently inserts a draft episode from a parsed podcast item. Internal. */
export const insertImportedEpisode = internalMutation({
  args: {
    title: v.string(),
    summary: v.string(),
    audioUrl: v.string(),
    canonicalUrl: v.string(),
    externalId: v.string(),
    durationSeconds: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    category: v.string(),
  },
  returns: v.id("contents"),
  handler: async (ctx, args) => {
    const slug = buildEpisodeSlug(args.title, args.externalId);

    const existing = await ctx.db
      .query("contents")
      .withIndex("by_tenantSlug_and_slug", (q) =>
        q.eq("tenantSlug", defaultTenant.slug).eq("slug", slug),
      )
      .unique();
    if (existing) {
      return existing._id;
    }

    const newId = await ctx.db.insert("contents", {
      tenantSlug: defaultTenant.slug,
      kind: "episode" as const,
      status: "draft" as const,
      slug,
      title: args.title,
      summary: args.summary,
      category: args.category,
      tags: [],
      isPremium: false,
      audioUrl: args.audioUrl,
      source: "rss" as const,
      canonicalUrl: args.canonicalUrl,
      externalId: args.externalId,
      ...(args.durationSeconds !== undefined
        ? { durationSeconds: args.durationSeconds }
        : {}),
      ...(args.imageUrl ? { heroImageUrl: args.imageUrl } : {}),
    });

    const newDoc = await ctx.db.get(newId);
    if (newDoc) {
      await syncContentInsert(ctx, newDoc);
    }
    return newId;
  },
});

const parsedEpisodeValidator = v.object({
  title: v.string(),
  audioUrl: v.string(),
  guid: v.string(),
  canonicalUrl: v.string(),
  summary: v.string(),
  durationSeconds: v.optional(v.number()),
  imageUrl: v.optional(v.string()),
  publishedAt: v.optional(v.string()),
});

async function fetchFeed(feedUrl: string): Promise<string | null> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": PODCAST_USER_AGENT,
        accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

/** Lists audio episodes of a podcast RSS feed for the CMS picker. Admin-gated. */
export const fetchPodcastFeed = action({
  args: { feedUrl: v.string() },
  returns: v.object({
    ok: v.boolean(),
    episodes: v.array(parsedEpisodeValidator),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, { feedUrl }) => {
    const viewer = await ctx.runQuery(api.cms.queries.getViewer, {});
    if (!viewer.isAuthenticated || !viewer.isAdmin) {
      throw new Error("Forbidden");
    }
    const xml = await fetchFeed(feedUrl);
    if (xml === null) {
      return { ok: false as const, episodes: [], reason: "fetch-failed" as const };
    }
    return { ok: true as const, episodes: parsePodcastFeed(xml) };
  },
});

/** Imports a specific episode (by guid) of a podcast feed as a draft. Admin-gated. */
export const importPodcastEpisode = action({
  args: { feedUrl: v.string(), guid: v.string(), category: v.optional(v.string()) },
  returns: v.union(
    v.object({ imported: v.literal(false), reason: v.string() }),
    v.object({
      imported: v.literal(true),
      contentId: v.id("contents"),
      title: v.string(),
    }),
  ),
  handler: async (ctx, { feedUrl, guid, category }) => {
    const viewer = await ctx.runQuery(api.cms.queries.getViewer, {});
    if (!viewer.isAuthenticated || !viewer.isAdmin) {
      throw new Error("Forbidden");
    }

    const xml = await fetchFeed(feedUrl);
    if (xml === null) {
      return { imported: false as const, reason: "fetch-failed" as const };
    }

    const episodes = parsePodcastFeed(xml);
    const episode = episodes.find((item) => item.guid === guid) ?? episodes[0];
    if (!episode) {
      return { imported: false as const, reason: "no-episode" as const };
    }

    const contentId: Id<"contents"> = await ctx.runMutation(
      internal.podcasts.import.insertImportedEpisode,
      {
        title: episode.title,
        summary: episode.summary,
        audioUrl: episode.audioUrl,
        canonicalUrl: episode.canonicalUrl,
        externalId: episode.guid,
        durationSeconds: episode.durationSeconds,
        imageUrl: episode.imageUrl,
        category: category?.trim() || DEFAULT_EPISODE_CATEGORY,
      },
    );

    return { imported: true as const, contentId, title: episode.title };
  },
});

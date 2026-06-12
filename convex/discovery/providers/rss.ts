import { internal } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";
import type { FetchDemand } from "../fetchDemand";
import type { ContentProvider } from "../provider";
import { normalizeScoringKey } from "../scoring";

export type RssEntryRaw = {
  title: string;
  link: string;
  guid?: string;
  summary: string;
  publishedAt?: string;
};

export type NormalizedRssEntry = {
  tenantSlug: string;
  kind: "article";
  status: "published";
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  isPremium: false;
  publishedAt: string;
  source: "rss";
  externalId: string;
  canonicalUrl: string;
};

export function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim();
}

export function firstTagContent(block: string, tagNames: string[]): string | undefined {
  for (const tag of tagNames) {
    const pattern = new RegExp(
      `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
      "i",
    );
    const match = block.match(pattern);
    if (match?.[1]) {
      return decodeXmlEntities(match[1]);
    }
  }

  return undefined;
}

function linkFromBlock(block: string): string | undefined {
  const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (hrefMatch?.[1]) {
    return decodeXmlEntities(hrefMatch[1]);
  }

  return firstTagContent(block, ["link"]);
}

export function splitFeedBlocks(xml: string): string[] {
  const isAtom = /<feed[\s>]/i.test(xml);
  const tag = isAtom ? "entry" : "item";
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const blocks: string[] = [];

  for (const match of xml.matchAll(pattern)) {
    if (match[0]) {
      blocks.push(match[0]);
    }
  }

  return blocks;
}

function stableSlugSuffix(externalId: string): string {
  let hash = 0;

  for (let index = 0; index < externalId.length; index += 1) {
    hash = (hash * 31 + externalId.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36).slice(0, 6).padStart(6, "0");
}

export function parseRssFeed(xml: string): RssEntryRaw[] {
  const entries: RssEntryRaw[] = [];

  for (const block of splitFeedBlocks(xml)) {
    const title = firstTagContent(block, ["title"]);
    const link = linkFromBlock(block);
    if (!title || !link) {
      continue;
    }

    const guid =
      firstTagContent(block, ["guid", "id"]) ??
      undefined;
    const summary =
      firstTagContent(block, ["description", "summary", "content"]) ?? "";
    const publishedAt =
      firstTagContent(block, ["pubDate", "published", "updated"]) ?? undefined;

    entries.push({
      title,
      link,
      guid,
      summary,
      publishedAt,
    });
  }

  return entries;
}

function slugFromRssTitle(title: string, externalId: string): string {
  const base = normalizeScoringKey(title);
  const prefix = base.length > 0 ? base : normalizeScoringKey(externalId) || "rss-item";
  return `${prefix}-${stableSlugSuffix(externalId)}`;
}

function normalizePublishedAt(publishedAt?: string): string {
  if (!publishedAt) {
    return new Date().toISOString();
  }

  const parsed = Date.parse(publishedAt);
  if (Number.isNaN(parsed)) {
    return new Date().toISOString();
  }

  return new Date(parsed).toISOString();
}

export function normalizeRssEntry(
  entry: RssEntryRaw,
  args: { tenantSlug: string },
): NormalizedRssEntry {
  const externalId = entry.guid?.trim() || entry.link;
  const title = entry.title.trim();

  return {
    tenantSlug: args.tenantSlug,
    kind: "article",
    status: "published",
    slug: slugFromRssTitle(title, externalId),
    title,
    summary: entry.summary.trim(),
    category: "rss",
    tags: [],
    isPremium: false,
    publishedAt: normalizePublishedAt(entry.publishedAt),
    source: "rss",
    externalId,
    canonicalUrl: entry.link,
  };
}

function resolveFeedUrls(config: Record<string, unknown> | null): string[] {
  const feeds = config?.feeds;
  if (!Array.isArray(feeds)) {
    return [];
  }

  return feeds.filter((feed): feed is string => typeof feed === "string" && feed.length > 0);
}

export async function fetchRssFeed(
  feedUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(feedUrl);
  if (!response.ok) {
    throw new Error(`RSS fetch failed with status ${response.status} for ${feedUrl}`);
  }

  return response.text();
}

export async function ingestRssDemand(
  ctx: ActionCtx,
  args: {
    tenantSlug: string;
    demand: FetchDemand;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<{ upserted: number }> {
  const providerConfig = await ctx.runQuery(
    internal.discovery.providerConfig.getTenantProviderConfig,
    {
      tenantSlug: args.tenantSlug,
      source: "rss",
    },
  );

  const feedUrls = resolveFeedUrls(providerConfig);
  if (feedUrls.length === 0) {
    return { upserted: 0 };
  }

  const normalized: NormalizedRssEntry[] = [];

  for (const feedUrl of feedUrls) {
    let entries: RssEntryRaw[] = [];

    try {
      const xml = await fetchRssFeed(feedUrl, fetchImpl);
      entries = parseRssFeed(xml);
    } catch {
      continue;
    }

    for (const entry of entries) {
      normalized.push(
        normalizeRssEntry(entry, {
          tenantSlug: args.tenantSlug,
        }),
      );
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

export const rssProvider: ContentProvider = {
  source: "rss",
  async ingest(ctx, args) {
    return ingestRssDemand(ctx, args);
  },
};

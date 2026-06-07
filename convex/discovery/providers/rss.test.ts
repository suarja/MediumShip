/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { internal } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../../convexTestModules";
import {
  ingestRssDemand,
  normalizeRssEntry,
  parseRssFeed,
  rssProvider,
} from "./rss";

const TENANT = "demo-media";
const FEED_URL = "https://example.com/feed.xml";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>First Article</title>
      <link>https://example.com/articles/first</link>
      <guid>first-guid-123</guid>
      <description>A brief summary of the first article.</description>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second Article</title>
      <link>https://example.com/articles/second</link>
      <description>Second summary.</description>
      <pubDate>Tue, 02 Jan 2024 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

function makeIngestCtx(t: ReturnType<typeof convexTest>) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runQuery: (ref: any, args: any) => t.query(ref, args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runMutation: (ref: any, args: any) => t.mutation(ref, args),
  } as never;
}

describe("parseRssFeed", () => {
  it("extracts title, link, summary, publishedAt, and guid from RSS 2.0", () => {
    const entries = parseRssFeed(SAMPLE_RSS);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      title: "First Article",
      link: "https://example.com/articles/first",
      guid: "first-guid-123",
      summary: "A brief summary of the first article.",
      publishedAt: "Mon, 01 Jan 2024 12:00:00 GMT",
    });
    expect(entries[1]?.guid).toBeUndefined();
    expect(entries[1]?.link).toBe("https://example.com/articles/second");
  });

  it("parses Atom entries with link href and id", () => {
    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Atom Post</title>
    <link href="https://example.com/atom/post" rel="alternate"/>
    <id>urn:uuid:abc</id>
    <summary>Atom summary.</summary>
    <published>2024-03-15T10:00:00Z</published>
  </entry>
</feed>`;

    const entries = parseRssFeed(atom);
    expect(entries).toEqual([
      {
        title: "Atom Post",
        link: "https://example.com/atom/post",
        guid: "urn:uuid:abc",
        summary: "Atom summary.",
        publishedAt: "2024-03-15T10:00:00Z",
      },
    ]);
  });
});

describe("normalizeRssEntry", () => {
  it("maps an entry into a contents insert shape", () => {
    const normalized = normalizeRssEntry(
      {
        title: "First Article",
        link: "https://example.com/articles/first",
        guid: "first-guid-123",
        summary: "A brief summary.",
        publishedAt: "Mon, 01 Jan 2024 12:00:00 GMT",
      },
      { tenantSlug: TENANT },
    );

    expect(normalized).toMatchObject({
      tenantSlug: TENANT,
      kind: "article",
      status: "published",
      source: "rss",
      externalId: "first-guid-123",
      canonicalUrl: "https://example.com/articles/first",
      title: "First Article",
      summary: "A brief summary.",
      category: "rss",
      tags: [],
      isPremium: false,
    });
    expect(normalized.slug).toBe("first-article");
    expect(normalized.publishedAt).toBeTruthy();
  });

  it("falls back to link when guid is absent", () => {
    const normalized = normalizeRssEntry(
      {
        title: "Second Article",
        link: "https://example.com/articles/second",
        summary: "Second summary.",
      },
      { tenantSlug: TENANT },
    );

    expect(normalized.externalId).toBe("https://example.com/articles/second");
  });
});

describe("rssProvider.ingest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns upserted 0 and does not fetch when rss feeds are not configured", async () => {
    const t = convexTest(schema, modules);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const ctx = makeIngestCtx(t);
    const result = await rssProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: ["science"] },
    });

    expect(result).toEqual({ upserted: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches configured feeds, parses entries, and upserts them", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          rss: { feeds: [FEED_URL] },
        },
      });
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_RSS,
    });

    const ctx = makeIngestCtx(t);
    const result = await ingestRssDemand(
      ctx,
      {
        tenantSlug: TENANT,
        demand: { categories: ["science"] },
      },
      fetchMock,
    );

    expect(result.upserted).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(FEED_URL);

    const rows = await t.run(async (db) =>
      db.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q.eq("tenantSlug", TENANT).eq("source", "rss"),
        )
        .collect(),
    );

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.externalId).sort()).toEqual([
      "first-guid-123",
      "https://example.com/articles/second",
    ]);
  });

  it("deduplicates entries on re-run via by_tenant_source_external", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          rss: { feeds: [FEED_URL] },
        },
      });
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_RSS,
    });

    const ctx = makeIngestCtx(t);
    const first = await ingestRssDemand(
      ctx,
      { tenantSlug: TENANT, demand: { categories: [] } },
      fetchMock,
    );
    const second = await ingestRssDemand(
      ctx,
      { tenantSlug: TENANT, demand: { categories: [] } },
      fetchMock,
    );

    expect(first.upserted).toBe(2);
    expect(second.upserted).toBe(0);
  });

  it("does not require demand.categories — interprets demand loosely", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          rss: { feeds: [FEED_URL] },
        },
      });
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_RSS,
    });

    const ctx = makeIngestCtx(t);
    const result = await ingestRssDemand(
      ctx,
      { tenantSlug: TENANT, demand: { categories: [] } },
      fetchMock,
    );

    expect(result.upserted).toBe(2);
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe("upsertIngested rss source", () => {
  it("accepts source rss in the ingested content validator", async () => {
    const t = convexTest(schema, modules);
    const item = normalizeRssEntry(
      {
        title: "RSS Item",
        link: "https://example.com/rss-item",
        guid: "rss-guid-1",
        summary: "Summary",
      },
      { tenantSlug: TENANT },
    );

    const result: { upserted: number } = await t.mutation(
      internal.discovery.ingest.upsertIngested,
      { items: [item] },
    );

    expect(result.upserted).toBe(1);
  });
});

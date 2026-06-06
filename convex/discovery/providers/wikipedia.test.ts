/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { internal } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../../convexTestModules";
import {
  fetchWikipediaArticleBody,
  fetchWikipediaCategoryPages,
  normalizeWikipediaPage,
  slugFromWikipediaTitle,
  toWikipediaCategoryTitle,
  WIKIPEDIA_USER_AGENT,
  wikipediaProvider,
} from "./wikipedia";

const TENANT = "demo-media";

function makeWikiPage(overrides: Partial<Parameters<typeof normalizeWikipediaPage>[0]> = {}) {
  return {
    pageid: 42,
    title: "Quantum mechanics",
    extract: "Quantum mechanics is a fundamental theory in physics.",
    fullurl: "https://en.wikipedia.org/wiki/Quantum_mechanics",
    thumbnail: { source: "https://upload.wikimedia.org/thumb/example.jpg" },
    ...overrides,
  };
}

describe("normalizeWikipediaPage", () => {
  it("maps a MediaWiki page into a contents insert shape", () => {
    const normalized = normalizeWikipediaPage(makeWikiPage(), {
      tenantSlug: TENANT,
      category: "science",
    });

    expect(normalized).toMatchObject({
      tenantSlug: TENANT,
      kind: "article",
      source: "wikipedia",
      externalId: "42",
      canonicalUrl: "https://en.wikipedia.org/wiki/Quantum_mechanics",
      title: "Quantum mechanics",
      summary: "Quantum mechanics is a fundamental theory in physics.",
      heroImageUrl: "https://upload.wikimedia.org/thumb/example.jpg",
      category: "science",
      tags: [],
      status: "published",
      isPremium: false,
    });
    expect(normalized.slug).toBe("quantum-mechanics");
    expect(normalized.publishedAt).toBeTruthy();
  });

  it("falls back to a wiki slug when the title normalizes empty", () => {
    expect(slugFromWikipediaTitle("!!!", 99)).toBe("wiki-99");
  });
});

describe("toWikipediaCategoryTitle", () => {
  it("converts a scoring slug into a MediaWiki category title", () => {
    expect(toWikipediaCategoryTitle("science-fiction")).toBe(
      "Category:Science_Fiction",
    );
  });
});

describe("upsertIngested", () => {
  it("deduplicates by tenantSlug + source + externalId", async () => {
    const t = convexTest(schema, modules);
    const item = normalizeWikipediaPage(makeWikiPage(), {
      tenantSlug: TENANT,
      category: "science",
    });

    const first: { upserted: number } = await t.mutation(
      internal.discovery.ingest.upsertIngested,
      { items: [item] },
    );
    const second: { upserted: number } = await t.mutation(
      internal.discovery.ingest.upsertIngested,
      { items: [item] },
    );

    expect(first.upserted).toBe(1);
    expect(second.upserted).toBe(0);

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q
            .eq("tenantSlug", TENANT)
            .eq("source", "wikipedia")
            .eq("externalId", "42"),
        )
        .collect(),
    );

    expect(rows).toHaveLength(1);
  });
});

describe("wikipediaProvider.ingest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function makeIngestCtx(t: ReturnType<typeof convexTest>) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runQuery: (ref: any, args: any) => t.query(ref, args),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runMutation: (ref: any, args: any) => t.mutation(ref, args),
    } as never;
  }

  it("fetches, normalizes, and upserts without duplicating on re-run", async () => {
    const t = convexTest(schema, modules);
    const searchResponse = {
      query: {
        pages: {
          "42": makeWikiPage(),
        },
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => searchResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    const ctx = makeIngestCtx(t);

    const first = await wikipediaProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: ["science"] },
    });
    const second = await wikipediaProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: ["science"] },
    });

    expect(first.upserted).toBe(1);
    expect(second.upserted).toBe(0);
    expect(fetchMock).toHaveBeenCalled();

    const request = fetchMock.mock.calls[0]?.[0] as string;
    expect(request).toContain("en.wikipedia.org/w/api.php");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        "User-Agent": expect.stringContaining("MediumShip"),
      }),
    });
  });

  it("advances the search offset so a refill returns genuinely new pages", async () => {
    const t = convexTest(schema, modules);

    // The mock returns a different page depending on the gsroffset, modelling
    // real Wikipedia pagination: offset 0 → page 1, offset 1 → page 2, etc.
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const offset = Number(new URL(url).searchParams.get("gsroffset") ?? "0");
      const pageId = offset + 1;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              [String(pageId)]: makeWikiPage({
                pageid: pageId,
                title: `Page ${pageId}`,
              }),
            },
          },
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const ctx = makeIngestCtx(t);

    const first = await wikipediaProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: ["science"] },
    });
    const second = await wikipediaProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: ["science"] },
    });

    // Both runs add NEW content — the offset advanced between them.
    expect(first.upserted).toBe(1);
    expect(second.upserted).toBe(1);

    const offsets = fetchMock.mock.calls.map((call) =>
      new URL(call[0] as string).searchParams.get("gsroffset"),
    );
    expect(offsets[0]).toBe("0");
    expect(offsets[1]).toBe("1");

    const rows = await t.run(async (db) =>
      db.db
        .query("contents")
        .withIndex("by_tenant_and_status", (q) =>
          q.eq("tenantSlug", TENANT).eq("status", "published"),
        )
        .collect(),
    );
    expect(rows).toHaveLength(2);
  });
});

describe("fetchWikipediaArticleBody", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests full plaintext extracts without exintro and returns trimmed body", async () => {
    const fullBody =
      "Quantum mechanics is a fundamental theory.\n\nIt describes nature at small scales.";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            "42": { pageid: 42, extract: `  ${fullBody}  ` },
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const body = await fetchWikipediaArticleBody(42, fetchMock);

    expect(body).toBe(fullBody);
    const requestUrl = fetchMock.mock.calls[0]?.[0] as string;
    const params = new URL(requestUrl).searchParams;
    expect(params.get("prop")).toBe("extracts");
    expect(params.get("explaintext")).toBe("1");
    expect(params.has("exintro")).toBe(false);
    expect(params.get("pageids")).toBe("42");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: { "User-Agent": WIKIPEDIA_USER_AGENT },
    });
  });

  it("returns an empty string for missing or malformed extract payloads", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: { pages: { "-1": { pageid: -1 } } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchWikipediaArticleBody(99, fetchMock)).toBe("");
    expect(await fetchWikipediaArticleBody(100, fetchMock)).toBe("");
  });
});

describe("fetchWikipediaCategoryPages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses categorymembers for cold start before search fallback", async () => {
    const membersResponse = {
      query: {
        categorymembers: [{ pageid: 7, title: "Physics" }],
      },
    };
    const detailsResponse = {
      query: {
        pages: {
          "7": makeWikiPage({ pageid: 7, title: "Physics" }),
        },
      },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => membersResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => detailsResponse,
      });

    const pages = await fetchWikipediaCategoryPages("science", fetchMock, {
      coldStart: true,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0]?.title).toBe("Physics");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

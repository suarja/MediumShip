/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregateTest from "@convex-dev/aggregate/test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { internal } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../../convexTestModules";

function makeTest() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "contentCategoryCounts");
  return t;
}
import { SERENDIPITY_PER_RUN } from "../ingest";
import {
  extractWikipediaTags,
  fetchWikipediaArticleBody,
  fetchWikipediaCategoryPages,
  fetchWikipediaRandomPages,
  isLowSignalWikipediaCategory,
  normalizeWikipediaPage,
  pickSerendipityCategoryTag,
  slugFromWikipediaTitle,
  toWikipediaCategoryTitle,
  WIKIPEDIA_CATEGORY_QUERY_PARAMS,
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

function makeWikiCategories(titles: string[]) {
  return titles.map((title) => ({ ns: 14, title }));
}

describe("extractWikipediaTags", () => {
  it("normalizes thematic categories and drops low-signal buckets", () => {
    const tags = extractWikipediaTags(
      makeWikiCategories([
        "Category:Physics",
        "Category:1740s_births",
        "Category:1877_births",
        "Category:1970s_country_album_stubs",
        "Category:Quantum_mechanics",
      ]),
    );

    expect(tags).toEqual(["physics", "quantum-mechanics"]);
  });

  it("caps tags per item", () => {
    const tags = extractWikipediaTags(
      makeWikiCategories(
        Array.from({ length: 12 }, (_, index) => `Category:Topic_${index}`),
      ),
      8,
    );

    expect(tags).toHaveLength(8);
  });

  it("returns empty when no usable categories remain", () => {
    expect(
      extractWikipediaTags(
        makeWikiCategories(["Category:1740s_births", "Category:Album_stubs"]),
      ),
    ).toEqual([]);
    expect(extractWikipediaTags(undefined)).toEqual([]);
  });
});

describe("isLowSignalWikipediaCategory", () => {
  it("flags year buckets and stub categories", () => {
    expect(isLowSignalWikipediaCategory("Category:1740s_births")).toBe(true);
    expect(isLowSignalWikipediaCategory("Category:1970s_country_album_stubs")).toBe(
      true,
    );
    expect(isLowSignalWikipediaCategory("Category:Physics")).toBe(false);
  });
});

describe("pickSerendipityCategoryTag", () => {
  it("prefers a thematic category over year/stub buckets", () => {
    expect(
      pickSerendipityCategoryTag(
        makeWikiCategories([
          "Category:1740s_births",
          "Category:German_composers",
          "Category:1970s_country_album_stubs",
        ]),
      ),
    ).toBe("german-composers");
  });
});

describe("WIKIPEDIA_CATEGORY_QUERY_PARAMS", () => {
  it("requests non-hidden categories from MediaWiki", () => {
    expect(WIKIPEDIA_CATEGORY_QUERY_PARAMS).toEqual({
      cllimit: "max",
      clshow: "!hidden",
    });
  });
});

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

  it("populates tags from real Wikipedia categories", () => {
    const normalized = normalizeWikipediaPage(
      makeWikiPage({
        categories: makeWikiCategories([
          "Category:Physics",
          "Category:1740s_births",
          "Category:Quantum_mechanics",
        ]),
      }),
      { tenantSlug: TENANT, category: "science" },
    );

    expect(normalized.tags).toEqual(["physics", "quantum-mechanics"]);
    expect(normalized.category).toBe("science");
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
    const t = makeTest();
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

  function makeIngestCtx(t: ReturnType<typeof makeTest>) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runQuery: (ref: any, args: any) => t.query(ref, args),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runMutation: (ref: any, args: any) => t.mutation(ref, args),
    } as never;
  }

  it("uses fr.wikipedia.org when providerConfigs.wikipedia.locale is fr", async () => {
    const t = makeTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          wikipedia: { locale: "fr" },
        },
      });
    });

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const params = new URL(url).searchParams;
      if (params.get("list") === "random") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ query: { random: [] } }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          query: { pages: { "42": makeWikiPage() } },
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const ctx = makeIngestCtx(t);
    await wikipediaProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: ["science"] },
    });

    const categoryRequest = fetchMock.mock.calls.find(
      (call) => new URL(call[0] as string).searchParams.get("gsrsearch") !== null,
    )?.[0] as string;
    expect(categoryRequest).toContain("fr.wikipedia.org/w/api.php");
  });

  it("defaults to en.wikipedia.org when wikipedia locale is not configured", async () => {
    const t = makeTest();

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const params = new URL(url).searchParams;
      if (params.get("list") === "random") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ query: { random: [] } }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          query: { pages: { "42": makeWikiPage() } },
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const ctx = makeIngestCtx(t);
    await wikipediaProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: ["science"] },
    });

    const categoryRequest = fetchMock.mock.calls.find(
      (call) => new URL(call[0] as string).searchParams.get("gsrsearch") !== null,
    )?.[0] as string;
    expect(categoryRequest).toContain("en.wikipedia.org/w/api.php");
  });

  it("fetches, normalizes, and upserts without duplicating on re-run", async () => {
    const t = makeTest();
    const searchResponse = {
      query: {
        pages: {
          "42": makeWikiPage(),
        },
      },
    };
    const randomListResponse = { query: { random: [] } };

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const params = new URL(url).searchParams;
      if (params.get("list") === "random") {
        return Promise.resolve({
          ok: true,
          json: async () => randomListResponse,
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => searchResponse,
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

    expect(first.upserted).toBe(1);
    expect(second.upserted).toBe(0);
    expect(fetchMock).toHaveBeenCalled();

    const categoryRequest = fetchMock.mock.calls.find(
      (call) => new URL(call[0] as string).searchParams.get("gsrsearch") !== null,
    )?.[0] as string;
    expect(categoryRequest).toContain("en.wikipedia.org/w/api.php");
    expect(new URL(categoryRequest).searchParams.get("prop")).toContain("categories");
    expect(new URL(categoryRequest).searchParams.get("clshow")).toBe("!hidden");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        "User-Agent": expect.stringContaining("MediumShip"),
      }),
    });
  });

  it("ingests a bounded serendipity batch with real categories, not a serendipity label", async () => {
    const t = makeTest();

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const params = new URL(url).searchParams;

      if (params.get("list") === "random") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            query: {
              random: [
                { id: 501, title: "Random topic" },
                { id: 502, title: "Another random" },
              ],
            },
          }),
        });
      }

      if (params.get("pageids") === "501|502") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            query: {
              pages: {
                "501": makeWikiPage({
                  pageid: 501,
                  title: "Random topic",
                  categories: makeWikiCategories(["Category:Astronomy"]),
                }),
                "502": makeWikiPage({
                  pageid: 502,
                  title: "Another random",
                  categories: makeWikiCategories(["Category:History"]),
                }),
              },
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ query: { pages: {} } }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const ctx = makeIngestCtx(t);
    const result = await wikipediaProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: [], serendipityCount: SERENDIPITY_PER_RUN },
    });

    expect(result.upserted).toBe(2);

    const randomCalls = fetchMock.mock.calls.filter(
      (call) => new URL(call[0] as string).searchParams.get("list") === "random",
    );
    expect(randomCalls).toHaveLength(1);
    expect(
      new URL(randomCalls[0]![0] as string).searchParams.get("rnlimit"),
    ).toBe(String(SERENDIPITY_PER_RUN));

    const rows = await t.run(async (db) =>
      db.db
        .query("contents")
        .withIndex("by_tenant_and_status", (q) =>
          q.eq("tenantSlug", TENANT).eq("status", "published"),
        )
        .collect(),
    );

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.category).sort()).toEqual(["astronomy", "history"]);
    expect(rows.every((row) => row.category !== "serendipity")).toBe(true);
    expect(rows.every((row) => row.tags.length > 0)).toBe(true);
  });

  it("deduplicates serendipity pages that overlap demand categories by externalId", async () => {
    const t = makeTest();

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const params = new URL(url).searchParams;

      if (params.get("list") === "random") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            query: { random: [{ id: 42, title: "Quantum mechanics" }] },
          }),
        });
      }

      if (params.get("pageids") === "42") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            query: {
              pages: {
                "42": makeWikiPage({
                  categories: makeWikiCategories(["Category:Physics"]),
                }),
              },
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          query: { pages: { "42": makeWikiPage() } },
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const ctx = makeIngestCtx(t);
    const result = await wikipediaProvider.ingest(ctx, {
      tenantSlug: TENANT,
      demand: { categories: ["science"], serendipityCount: SERENDIPITY_PER_RUN },
    });

    expect(result.upserted).toBe(1);

    const rows = await t.run(async (db) =>
      db.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q.eq("tenantSlug", TENANT).eq("source", "wikipedia").eq("externalId", "42"),
        )
        .collect(),
    );
    expect(rows).toHaveLength(1);
  });

  it("advances the search offset so a refill returns genuinely new pages", async () => {
    const t = makeTest();

    // The mock returns a different page depending on the gsroffset, modelling
    // real Wikipedia pagination: offset 0 → page 1, offset 1 → page 2, etc.
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const params = new URL(url).searchParams;
      if (params.get("list") === "random") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ query: { random: [] } }),
        });
      }

      const offset = Number(params.get("gsroffset") ?? "0");
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

    const offsets = fetchMock.mock.calls
      .map((call) => new URL(call[0] as string).searchParams.get("gsroffset"))
      .filter((value): value is string => value !== null);
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

describe("fetchWikipediaRandomPages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses list=random then fetches extracts and categories for those pages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: { random: [{ id: 99, title: "Surprise article" }] },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              "99": makeWikiPage({
                pageid: 99,
                title: "Surprise article",
                categories: makeWikiCategories(["Category:Biology"]),
              }),
            },
          },
        }),
      });

    const pages = await fetchWikipediaRandomPages(4, fetchMock);

    expect(pages).toHaveLength(1);
    expect(pages[0]?.categories?.[0]?.title).toBe("Category:Biology");

    const randomUrl = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(randomUrl.searchParams.get("list")).toBe("random");
    expect(randomUrl.searchParams.get("rnnamespace")).toBe("0");
    expect(randomUrl.searchParams.get("rnlimit")).toBe("4");

    const detailsUrl = new URL(fetchMock.mock.calls[1]![0] as string);
    expect(detailsUrl.searchParams.get("pageids")).toBe("99");
    expect(detailsUrl.searchParams.get("prop")).toContain("categories");
    expect(detailsUrl.searchParams.get("clshow")).toBe("!hidden");
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

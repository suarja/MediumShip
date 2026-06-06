/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { internal } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../../convexTestModules";
import {
  fetchWikipediaCategoryPages,
  normalizeWikipediaPage,
  slugFromWikipediaTitle,
  toWikipediaCategoryTitle,
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

    const ctx = {
      runMutation: (
        ref: typeof internal.discovery.ingest.upsertIngested,
        args: { items: ReturnType<typeof normalizeWikipediaPage>[] },
      ) => t.mutation(ref, args),
    };

    const first = await wikipediaProvider.ingest(ctx as never, {
      tenantSlug: TENANT,
      demand: { categories: ["science"] },
    });
    const second = await wikipediaProvider.ingest(ctx as never, {
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

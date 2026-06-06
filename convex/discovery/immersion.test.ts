/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const TENANT = "demo-media";

async function insertWikiArticle(
  t: ReturnType<typeof convexTest>,
  args: {
    externalId: string;
    articleBody?: string;
  },
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: TENANT,
      kind: "article",
      status: "published",
      slug: `wiki-${args.externalId}`,
      title: "Quantum mechanics",
      summary: "Short extract only.",
      category: "science",
      tags: [],
      isPremium: false,
      publishedAt: "2026-06-07T12:00:00.000Z",
      source: "wikipedia",
      externalId: args.externalId,
      canonicalUrl: "https://en.wikipedia.org/wiki/Quantum_mechanics",
      ...(args.articleBody ? { articleBody: args.articleBody } : {}),
    }),
  );
}

async function insertCmsArticle(
  t: ReturnType<typeof convexTest>,
  args: { articleBody?: string } = {},
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: TENANT,
      kind: "article",
      status: "published",
      slug: "cms-article",
      title: "Editorial piece",
      summary: "CMS summary.",
      category: "Analyse",
      tags: [],
      isPremium: false,
      publishedAt: "2026-06-07T12:00:00.000Z",
      source: "cms",
      ...(args.articleBody ? { articleBody: args.articleBody } : {}),
    }),
  );
}

describe("fetchArticleBody", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches and patches articleBody for wikipedia content missing a body", async () => {
    const t = convexTest(schema, modules);
    const contentId = await insertWikiArticle(t, { externalId: "42" });
    const fullBody = "Full article paragraph one.\n\nFull article paragraph two.";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            "42": { pageid: 42, extract: fullBody },
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await t.action(api.discovery.immersion.fetchArticleBody, {
      contentId,
    });

    expect(result).toEqual({ articleBody: fullBody, fetched: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const stored = await t.run(async (ctx) => ctx.db.get(contentId));
    expect(stored?.articleBody).toBe(fullBody);
  });

  it("returns cached articleBody without fetching when already present", async () => {
    const t = convexTest(schema, modules);
    const cachedBody = "Already cached full article.";
    const contentId = await insertWikiArticle(t, {
      externalId: "42",
      articleBody: cachedBody,
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await t.action(api.discovery.immersion.fetchArticleBody, {
      contentId,
    });

    expect(result).toEqual({ articleBody: cachedBody, fetched: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no-ops for non-wikipedia content", async () => {
    const t = convexTest(schema, modules);
    const contentId = await insertCmsArticle(t);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await t.action(api.discovery.immersion.fetchArticleBody, {
      contentId,
    });

    expect(result).toEqual({ articleBody: "", fetched: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns safely for unknown or unpublished content", async () => {
    const t = convexTest(schema, modules);
    const draftId = await t.run(async (ctx) =>
      ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "article",
        status: "draft",
        slug: "draft",
        title: "Draft",
        summary: "Draft summary",
        category: "science",
        tags: [],
        isPremium: false,
        source: "wikipedia",
        externalId: "99",
      }),
    );
    const deletedId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "article",
        status: "published",
        slug: "deleted",
        title: "Deleted",
        summary: "Gone",
        category: "science",
        tags: [],
        isPremium: false,
        source: "wikipedia",
        externalId: "100",
      });
      await ctx.db.delete(id);
      return id;
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const unknown = await t.action(api.discovery.immersion.fetchArticleBody, {
      contentId: deletedId,
    });
    const draft = await t.action(api.discovery.immersion.fetchArticleBody, {
      contentId: draftId,
    });

    expect(unknown).toEqual({ articleBody: "", fetched: false });
    expect(draft).toEqual({ articleBody: "", fetched: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty body without throwing when the provider fetch fails", async () => {
    const t = convexTest(schema, modules);
    const contentId = await insertWikiArticle(t, { externalId: "42" });

    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await t.action(api.discovery.immersion.fetchArticleBody, {
      contentId,
    });

    expect(result).toEqual({ articleBody: "", fetched: false });

    const stored = await t.run(async (ctx) => ctx.db.get(contentId));
    expect(stored?.articleBody).toBeUndefined();
  });
});

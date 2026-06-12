/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregateTest from "@convex-dev/aggregate/test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { parseWikipediaUrl } from "./import";

const ARTICLE = {
  title: "Indignation morale",
  summary: "Résumé",
  articleBody: "Corps complet de l'article…",
  canonicalUrl: "https://fr.wikipedia.org/wiki/Indignation_morale",
  externalId: "12345",
  coverImageUrl: "https://upload.wikimedia.org/cover.jpg",
  category: "Analyses",
  tags: [],
  pageId: 12345,
};

describe("parseWikipediaUrl", () => {
  it("parses lang + title from a fr article url", () => {
    expect(parseWikipediaUrl("https://fr.wikipedia.org/wiki/Indignation_morale")).toEqual({
      lang: "fr",
      title: "Indignation morale",
    });
  });

  it("parses an en mobile url", () => {
    expect(parseWikipediaUrl("https://en.m.wikipedia.org/wiki/Moral_outrage")).toEqual({
      lang: "en",
      title: "Moral outrage",
    });
  });

  it("returns null for non-wikipedia urls", () => {
    expect(parseWikipediaUrl("https://example.com/wiki/Foo")).toBeNull();
    expect(parseWikipediaUrl("https://fr.wikipedia.org/")).toBeNull();
    expect(parseWikipediaUrl("not a url")).toBeNull();
  });
});

describe("insertImportedWikipediaArticle", () => {
  it("creates a draft article tagged as a wikipedia source", async () => {
    const t = convexTest(schema, modules);
    aggregateTest.register(t, "contentCategoryCounts");

    const id = await t.mutation(
      internal.wikipedia.import.insertImportedWikipediaArticle,
      ARTICLE,
    );

    const doc = await t.run((ctx) => ctx.db.get(id));
    expect(doc?.kind).toBe("article");
    expect(doc?.status).toBe("draft");
    expect(doc?.source).toBe("wikipedia");
    expect(doc?.canonicalUrl).toBe(ARTICLE.canonicalUrl);
    expect(doc?.externalId).toBe(ARTICLE.externalId);
    expect(doc?.articleBody).toBe(ARTICLE.articleBody);
    expect(doc?.heroImageUrl).toBe(ARTICLE.coverImageUrl);
  });

  it("is idempotent on the same title + pageId", async () => {
    const t = convexTest(schema, modules);
    aggregateTest.register(t, "contentCategoryCounts");

    const first = await t.mutation(
      internal.wikipedia.import.insertImportedWikipediaArticle,
      ARTICLE,
    );
    const second = await t.mutation(
      internal.wikipedia.import.insertImportedWikipediaArticle,
      ARTICLE,
    );

    expect(second).toBe(first);
    const all = await t.run((ctx) => ctx.db.query("contents").collect());
    expect(all).toHaveLength(1);
  });
});

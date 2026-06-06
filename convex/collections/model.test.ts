import { describe, expect, it } from "vitest";

import type { Doc } from "../_generated/dataModel";
import { toCollectionItem, toCollectionSummary } from "./model";

type CollectionDoc = Doc<"collections">;
type ContentDoc = Doc<"contents">;

function makeCollectionDoc(overrides: Partial<CollectionDoc> = {}): CollectionDoc {
  return {
    _id: "coll_abc" as CollectionDoc["_id"],
    _creationTime: 0,
    tenantSlug: "demo",
    status: "published",
    slug: "test-collection",
    title: "Test Collection",
    summary: "A test collection",
    updatedAt: 0,
    ...overrides,
  } as CollectionDoc;
}

function makeContentDoc(overrides: Partial<ContentDoc> = {}): ContentDoc {
  return {
    _id: "cont_123" as ContentDoc["_id"],
    _creationTime: 0,
    tenantSlug: "demo",
    kind: "article",
    status: "published",
    slug: "an-article",
    title: "An Article",
    summary: "Summary",
    category: "Analyses",
    tags: [],
    isPremium: false,
    ...overrides,
  } as ContentDoc;
}

describe("toCollectionSummary", () => {
  it("shapes a doc into a Collection summary", () => {
    const doc = makeCollectionDoc();
    const result = toCollectionSummary(doc, 5);
    expect(result).toEqual({
      _id: "coll_abc",
      slug: "test-collection",
      title: "Test Collection",
      summary: "A test collection",
      coverImageUrl: undefined,
      itemCount: 5,
    });
  });

  it("includes coverImageUrl when present", () => {
    const doc = makeCollectionDoc({ coverImageUrl: "https://example.com/img.jpg" });
    const result = toCollectionSummary(doc, 2);
    expect(result.coverImageUrl).toBe("https://example.com/img.jpg");
  });

  it("passes through itemCount exactly", () => {
    const doc = makeCollectionDoc();
    expect(toCollectionSummary(doc, 0).itemCount).toBe(0);
    expect(toCollectionSummary(doc, 14).itemCount).toBe(14);
  });
});

describe("toCollectionItem", () => {
  it("shapes a content doc into a CollectionItem", () => {
    const doc = makeContentDoc();
    const result = toCollectionItem(doc);
    expect(result).toEqual({
      contentId: "cont_123",
      title: "An Article",
      kind: "article",
      category: "Analyses",
      isPremium: false,
      coverImageUrl: undefined,
    });
  });

  it("maps heroImageUrl to coverImageUrl", () => {
    const doc = makeContentDoc({ heroImageUrl: "https://example.com/hero.jpg" });
    expect(toCollectionItem(doc).coverImageUrl).toBe("https://example.com/hero.jpg");
  });

  it("preserves isPremium flag", () => {
    const doc = makeContentDoc({ isPremium: true });
    expect(toCollectionItem(doc).isPremium).toBe(true);
  });

  it("preserves kind for episode and video", () => {
    expect(toCollectionItem(makeContentDoc({ kind: "episode" })).kind).toBe("episode");
    expect(toCollectionItem(makeContentDoc({ kind: "video" })).kind).toBe("video");
  });
});

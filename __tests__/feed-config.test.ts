import { describe, expect, it } from "@jest/globals";

import {
  createDefaultFeedSection,
  filterAndOrderFeedContent,
  normalizeEnabledModules,
  normalizeFeedSections,
} from "../src/features/tenant/public-config";
import type { ContentDoc } from "../src/features/content/types";

const contents: ContentDoc[] = [
  {
    _id: "video-1",
    tenantSlug: "demo-media",
    kind: "video",
    status: "published",
    title: "Video item",
    summary: "Watch",
    category: "Video",
    tags: [],
    isPremium: false,
    publishedAt: "2026-06-03T10:00:00.000Z",
  },
  {
    _id: "article-1",
    tenantSlug: "demo-media",
    kind: "article",
    status: "published",
    title: "Article item",
    summary: "Read",
    category: "Article",
    tags: [],
    isPremium: false,
    publishedAt: "2026-06-03T08:00:00.000Z",
  },
  {
    _id: "episode-1",
    tenantSlug: "demo-media",
    kind: "episode",
    status: "published",
    title: "Episode item",
    summary: "Listen",
    category: "Episode",
    tags: [],
    isPremium: true,
    publishedAt: "2026-06-03T09:00:00.000Z",
  },
];

describe("filterAndOrderFeedContent", () => {
  it("uses backend-driven feed section order", () => {
    const result = filterAndOrderFeedContent(
      contents,
      ["articles", "episodes", "videos", "premium"],
      [
        { kind: "video", title: "Watch now" },
        { kind: "article", title: "Read now" },
      ],
    );

    expect(result.map((item) => item._id)).toEqual(["video-1", "article-1"]);
  });

  it("filters out content kinds whose modules are disabled", () => {
    const result = filterAndOrderFeedContent(
      contents,
      ["articles", "premium"],
      [
        { kind: "video", title: "Watch now" },
        { kind: "article", title: "Read now" },
      ],
    );

    expect(result.map((item) => item._id)).toEqual(["article-1"]);
  });

  it("filters out premium content when the premium module is disabled", () => {
    const result = filterAndOrderFeedContent(
      contents,
      ["articles", "episodes", "videos"],
      [
        { kind: "article", title: "Read now" },
        { kind: "episode", title: "Listen now" },
        { kind: "video", title: "Watch now" },
      ],
    );

    expect(result.map((item) => item._id)).toEqual(["article-1", "video-1"]);
  });
});

describe("normalizeEnabledModules", () => {
  it("keeps an explicit empty module selection instead of restoring defaults", () => {
    expect(normalizeEnabledModules([])).toEqual([]);
  });
});

describe("normalizeFeedSections", () => {
  it("removes duplicate kinds while keeping the first occurrence", () => {
    expect(
      normalizeFeedSections(
        [
          { kind: "article", title: "Read now" },
          { kind: "article", title: "Again" },
          { kind: "video", title: "Watch now" },
        ],
        ["articles", "videos", "premium"],
      ),
    ).toEqual([
      { kind: "article", title: "Read now" },
      { kind: "video", title: "Watch now" },
    ]);
  });
});

describe("createDefaultFeedSection", () => {
  it("returns the canonical section title for a kind", () => {
    expect(createDefaultFeedSection("episode")).toEqual({
      kind: "episode",
      title: "New episodes",
    });
  });
});

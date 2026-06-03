import { describe, expect, it } from "@jest/globals";

import { filterAndOrderFeedContent } from "../src/features/tenant/public-config";
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
});

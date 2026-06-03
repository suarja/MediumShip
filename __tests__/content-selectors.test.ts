import { describe, expect, it } from "@jest/globals";

import { toContentCardModel } from "../src/features/content/selectors";

describe("toContentCardModel", () => {
  it("maps published video content to a premium-aware card model", () => {
    const result = toContentCardModel({
      _id: "content_1" as never,
      kind: "video",
      status: "published",
      title: "Democratie locale",
      summary: "Long-form debate",
      category: "Debat",
      tags: ["video"],
      isPremium: true,
      publishedAt: "2026-06-03T10:00:00.000Z",
      tenantSlug: "demo-media",
      durationSeconds: 3862,
      videoSource: {
        kind: "youtube",
        youtubeVideoId: "abc123xyz00",
        youtubeUrl: "https://www.youtube.com/watch?v=abc123xyz00",
      },
    });

    expect(result.kindLabel).toBe("Video");
    expect(result.metaLabel).toContain("Premium");
    expect(result.href).toBe("/video/content_1");
  });

  it("maps an article to a reading-time meta label", () => {
    const result = toContentCardModel({
      _id: "content_2" as never,
      kind: "article",
      status: "published",
      title: "L'economie du soin",
      summary: "Une analyse",
      category: "Analyse",
      tags: ["analyse"],
      isPremium: false,
      publishedAt: "2026-06-03T08:00:00.000Z",
      tenantSlug: "demo-media",
      readingTimeMinutes: 18,
    });

    expect(result.kindLabel).toBe("Article");
    expect(result.metaLabel).toContain("18 min read");
    expect(result.metaLabel).not.toContain("Premium");
    expect(result.href).toBe("/article/content_2");
  });
});

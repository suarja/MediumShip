import { describe, expect, it } from "@jest/globals";

import {
  getContentCoverImageUrl,
  getYoutubeVideoId,
  normalizeRemoteImageUrl,
  toContentCardModel,
} from "../src/features/content/selectors";

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
    expect(result.coverImageUrl).toBe(
      "https://i.ytimg.com/vi/abc123xyz00/hqdefault.jpg",
    );
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

  it("prefers an explicit hero image over the youtube fallback thumbnail", () => {
    expect(
      getContentCoverImageUrl({
        kind: "video",
        heroImageUrl: "https://cdn.example.com/video-cover.jpg",
        videoSource: {
          kind: "youtube",
          youtubeVideoId: "abc123xyz00",
          youtubeUrl: "https://www.youtube.com/watch?v=abc123xyz00",
        },
      }),
    ).toBe("https://cdn.example.com/video-cover.jpg");
  });

  it("normalizes google image result urls to direct image urls", () => {
    expect(
      normalizeRemoteImageUrl(
        "https://www.google.com/imgres?q=demo&imgurl=https%3A%2F%2Fexample.com%2Fcover.jpg&imgrefurl=https%3A%2F%2Fexample.com",
      ),
    ).toBe("https://example.com/cover.jpg");
  });

  it("derives the youtube id from the youtube url when the stored id is stale", () => {
    expect(
      getYoutubeVideoId({
        youtubeUrl: "https://youtu.be/EfstHja6-jc?si=ywTGl4MKSPkvAmLb",
        youtubeVideoId: "abc123xyz00",
      }),
    ).toBe("EfstHja6-jc");
  });
});

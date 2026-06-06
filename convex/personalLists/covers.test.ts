import { describe, expect, it } from "vitest";

import { getContentCoverImageUrl } from "./covers";

describe("personalLists covers", () => {
  it("prefers heroImageUrl when present", () => {
    expect(
      getContentCoverImageUrl({
        heroImageUrl: "https://example.com/hero.jpg",
        kind: "article",
        videoSource: undefined,
      }),
    ).toBe("https://example.com/hero.jpg");
  });

  it("falls back to a youtube thumbnail for youtube videos", () => {
    expect(
      getContentCoverImageUrl({
        kind: "video",
        videoSource: {
          kind: "youtube",
          youtubeVideoId: "abc123",
          youtubeUrl: "https://www.youtube.com/watch?v=abc123",
        },
      }),
    ).toBe("https://i.ytimg.com/vi/abc123/hqdefault.jpg");
  });

  it("ignores a youtube watch-page hero url in favor of the real thumbnail", () => {
    expect(
      getContentCoverImageUrl({
        kind: "video",
        heroImageUrl: "https://www.youtube.com/watch?v=abc123",
        videoSource: {
          kind: "youtube",
          youtubeVideoId: "abc123",
          youtubeUrl: "https://www.youtube.com/watch?v=abc123",
        },
      }),
    ).toBe("https://i.ytimg.com/vi/abc123/hqdefault.jpg");
  });
});

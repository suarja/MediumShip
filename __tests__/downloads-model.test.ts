import { getDownloadSupport } from "../src/features/downloads/model";

describe("getDownloadSupport", () => {
  it("supports articles without a media source", () => {
    expect(
      getDownloadSupport({
        _id: "article_1",
        tenantSlug: "demo",
        kind: "article",
        status: "published",
        title: "Story",
        summary: "Summary",
        category: "News",
        tags: [],
        isPremium: false,
        articleBody: "Body",
      }),
    ).toEqual({ kind: "article" });
  });

  it("supports episodes with an audio source", () => {
    expect(
      getDownloadSupport({
        _id: "episode_1",
        tenantSlug: "demo",
        kind: "episode",
        status: "published",
        title: "Episode",
        summary: "Summary",
        category: "Podcast",
        tags: [],
        isPremium: false,
        audioUrl: "https://cdn.example.com/audio.mp3",
      }),
    ).toEqual({
      kind: "episode",
      sourceUrl: "https://cdn.example.com/audio.mp3",
    });
  });

  it("supports hosted videos and rejects YouTube videos", () => {
    expect(
      getDownloadSupport({
        _id: "video_1",
        tenantSlug: "demo",
        kind: "video",
        status: "published",
        title: "Hosted video",
        summary: "Summary",
        category: "Video",
        tags: [],
        isPremium: false,
        videoSource: {
          kind: "hosted",
          uploadKey: "asset-1",
          playbackUrl: "https://cdn.example.com/video.mp4",
        },
      }),
    ).toEqual({
      kind: "hostedVideo",
      sourceUrl: "https://cdn.example.com/video.mp4",
    });

    expect(
      getDownloadSupport({
        _id: "video_2",
        tenantSlug: "demo",
        kind: "video",
        status: "published",
        title: "YouTube video",
        summary: "Summary",
        category: "Video",
        tags: [],
        isPremium: false,
        videoSource: {
          kind: "youtube",
          youtubeUrl: "https://www.youtube.com/watch?v=abc",
          youtubeVideoId: "abc",
        },
      }),
    ).toEqual({
      kind: "unsupported",
      reason: "youtube",
    });
  });
});

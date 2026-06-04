import { collectContentUrlWarnings } from "../apps/cms/lib/content-url-warnings";

const base = {
  kind: "episode" as const,
  audioUrl: "",
  heroImageUrl: "",
  videoSourceKind: "" as "" | "youtube" | "hosted",
  youtubeUrl: "",
  playbackUrl: "",
};

describe("collectContentUrlWarnings", () => {
  it("accepts a real audio URL with no warnings", () => {
    expect(
      collectContentUrlWarnings({
        ...base,
        audioUrl: "https://stateimpact.npr.org/oklahoma/files/2022/04/Clip_1.mp3",
      }),
    ).toEqual([]);
  });

  it("flags an Unsplash image URL pasted into the audio field", () => {
    const warnings = collectContentUrlWarnings({
      ...base,
      audioUrl:
        "https://images.unsplash.com/photo-1622186477895-f2af6a0f5a97?q=80&w=2070",
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/image/i);
  });

  it("flags an empty audio URL for an episode", () => {
    expect(collectContentUrlWarnings({ ...base, audioUrl: "" })).toEqual([
      expect.stringMatching(/vide/i),
    ]);
  });

  it("flags a non-YouTube link in the YouTube field", () => {
    const warnings = collectContentUrlWarnings({
      ...base,
      kind: "video",
      videoSourceKind: "youtube",
      youtubeUrl: "https://vimeo.com/12345",
    });
    expect(warnings).toEqual([expect.stringMatching(/YouTube/i)]);
  });

  it("accepts a valid YouTube link", () => {
    expect(
      collectContentUrlWarnings({
        ...base,
        kind: "video",
        videoSourceKind: "youtube",
        youtubeUrl: "https://youtu.be/EfstHja6-jc",
      }),
    ).toEqual([]);
  });

  it("flags an audio file pasted into the hero image field", () => {
    const warnings = collectContentUrlWarnings({
      ...base,
      kind: "article",
      heroImageUrl: "https://cdn.example.com/track.mp3",
    });
    expect(warnings).toEqual([expect.stringMatching(/audio\/vid/i)]);
  });
});

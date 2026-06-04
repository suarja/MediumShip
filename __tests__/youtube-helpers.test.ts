import { describe, expect, it } from "@jest/globals";

import {
  extractYoutubeVideoId,
  parseDurationSeconds,
} from "../convex/youtube/helpers";

describe("extractYoutubeVideoId", () => {
  it("extracts from watch URLs", () => {
    expect(
      extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts from short URLs", () => {
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts from shorts URLs", () => {
    expect(extractYoutubeVideoId("https://youtube.com/shorts/abc123")).toBe(
      "abc123",
    );
  });

  it("extracts from embed URLs", () => {
    expect(extractYoutubeVideoId("https://youtube.com/embed/xyz789")).toBe(
      "xyz789",
    );
  });

  it("returns null for non-youtube URLs", () => {
    expect(extractYoutubeVideoId("https://vimeo.com/video/123")).toBeNull();
  });
});

describe("parseDurationSeconds", () => {
  it("parses ISO 8601 video durations", () => {
    expect(parseDurationSeconds("PT1H2M3S")).toBe(3723);
  });
});

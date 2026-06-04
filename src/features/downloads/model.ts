import type { ContentDoc } from "../content/types";

export type DownloadSupport =
  | { kind: "article" }
  | { kind: "episode"; sourceUrl: string }
  | { kind: "hostedVideo"; sourceUrl: string }
  | { kind: "unsupported"; reason: "youtube" | "missingSource" };

export function getDownloadSupport(content: ContentDoc): DownloadSupport {
  if (content.kind === "article") {
    return { kind: "article" };
  }

  if (content.kind === "episode") {
    return content.audioUrl
      ? { kind: "episode", sourceUrl: content.audioUrl }
      : { kind: "unsupported", reason: "missingSource" };
  }

  if (content.videoSource?.kind === "hosted") {
    return {
      kind: "hostedVideo",
      sourceUrl: content.videoSource.playbackUrl,
    };
  }

  return {
    kind: "unsupported",
    reason: content.videoSource?.kind === "youtube" ? "youtube" : "missingSource",
  };
}

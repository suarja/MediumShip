import type { ContentCardModel, ContentDoc, ContentKind } from "./types";

const KIND_LABELS: Record<ContentKind, string> = {
  article: "Article",
  episode: "Episode",
  video: "Video",
};

export function normalizeRemoteImageUrl(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes("google.") &&
      parsed.pathname === "/imgres"
    ) {
      const nested = parsed.searchParams.get("imgurl");
      if (nested) {
        return normalizeRemoteImageUrl(decodeURIComponent(nested));
      }
    }

    if (parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export function getYoutubeVideoId(
  source:
    | Pick<Extract<NonNullable<ContentDoc["videoSource"]>, { kind: "youtube" }>, "youtubeUrl" | "youtubeVideoId">
    | undefined,
) {
  if (!source) {
    return undefined;
  }

  const directId = source.youtubeVideoId.trim();

  try {
    const parsed = new URL(source.youtubeUrl);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const pathId = parsed.pathname.split("/").filter(Boolean)[0];
      return pathId || directId || undefined;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = parsed.searchParams.get("v");
      if (watchId) {
        return watchId;
      }

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts") {
        return parts[1] || directId || undefined;
      }
    }
  } catch {
    return directId || undefined;
  }

  return directId || undefined;
}

export function getYoutubeThumbnailUrl(youtubeVideoId: string) {
  return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
}

export function getYoutubeEmbedUrl(
  source:
    | Pick<Extract<NonNullable<ContentDoc["videoSource"]>, { kind: "youtube" }>, "youtubeUrl" | "youtubeVideoId">
    | undefined,
) {
  const youtubeVideoId = getYoutubeVideoId(source);
  if (!youtubeVideoId) {
    return undefined;
  }

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`);
  embedUrl.searchParams.set("playsinline", "1");
  embedUrl.searchParams.set("rel", "0");
  embedUrl.searchParams.set("modestbranding", "1");

  return embedUrl.toString();
}

export function getYoutubeLaunchUrl(
  source:
    | Pick<Extract<NonNullable<ContentDoc["videoSource"]>, { kind: "youtube" }>, "youtubeUrl" | "youtubeVideoId">
    | undefined,
) {
  const youtubeVideoId = getYoutubeVideoId(source);
  if (!youtubeVideoId) {
    return undefined;
  }

  const watchUrl = new URL("https://www.youtube.com/watch");
  watchUrl.searchParams.set("v", youtubeVideoId);
  watchUrl.searchParams.set("autoplay", "1");

  return watchUrl.toString();
}

export function getContentCoverImageUrl(
  content: Pick<ContentDoc, "heroImageUrl" | "kind" | "videoSource">,
) {
  const normalizedHeroImageUrl = normalizeRemoteImageUrl(content.heroImageUrl);
  if (normalizedHeroImageUrl) {
    return normalizedHeroImageUrl;
  }

  if (content.kind === "video" && content.videoSource?.kind === "youtube") {
    const youtubeVideoId = getYoutubeVideoId(content.videoSource);
    if (youtubeVideoId) {
      return getYoutubeThumbnailUrl(youtubeVideoId);
    }
  }

  return undefined;
}

export function toContentCardModel(content: ContentDoc): ContentCardModel {
  const metaParts: string[] = [];

  if (content.kind === "article" && content.readingTimeMinutes) {
    metaParts.push(`${content.readingTimeMinutes} min read`);
  }

  if (
    (content.kind === "episode" || content.kind === "video") &&
    content.durationSeconds
  ) {
    metaParts.push(`${Math.round(content.durationSeconds / 60)} min`);
  }

  if (content.isPremium) {
    metaParts.push("Premium");
  }

  return {
    id: content._id,
    kind: content.kind,
    kindLabel: KIND_LABELS[content.kind],
    title: content.title,
    summary: content.summary,
    metaLabel: metaParts.join(" · "),
    href: `/${content.kind}/${content._id}`,
    isPremium: content.isPremium,
    coverImageUrl: getContentCoverImageUrl(content),
  };
}

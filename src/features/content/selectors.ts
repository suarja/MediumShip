import type { ContentCardModel, ContentDoc, ContentKind } from "./types";

const KIND_LABELS: Record<ContentKind, string> = {
  article: "Article",
  episode: "Episode",
  video: "Video",
};

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
  };
}

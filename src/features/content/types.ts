export type ContentKind = "article" | "episode" | "video";
export type ContentStatus = "draft" | "published" | "archived";

export type VideoSource =
  | {
      kind: "youtube";
      youtubeVideoId: string;
      youtubeUrl: string;
    }
  | {
      kind: "hosted";
      uploadKey: string;
      playbackUrl: string;
    };

/**
 * Shared editorial document shape as read from Convex. Kept independent of the
 * generated `Doc<"contents">` type so selectors and tests stay decoupled from
 * the backend codegen.
 */
export type ContentDoc = {
  _id: string;
  tenantSlug: string;
  kind: ContentKind;
  status: ContentStatus;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  publishedAt?: string;
  heroImageUrl?: string;
  readingTimeMinutes?: number;
  articleBody?: string;
  audioUrl?: string;
  durationSeconds?: number;
  videoSource?: VideoSource;
};

export type ContentCardModel = {
  id: string;
  kind: ContentKind;
  kindLabel: string;
  title: string;
  summary: string;
  metaLabel: string;
  href: string;
  isPremium: boolean;
  coverImageUrl?: string;
};

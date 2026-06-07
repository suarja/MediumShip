import type { ContentSource } from "./source";

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
  /** External attribution (e.g. the YouTube channel name) when ingested. */
  author?: string;
  readingTimeMinutes?: number;
  articleBody?: string;
  audioUrl?: string;
  durationSeconds?: number;
  videoSource?: VideoSource;
  source?: ContentSource;
  externalId?: string;
  canonicalUrl?: string;
};

export type ContentCardModel = {
  id: string;
  kind: ContentKind;
  kindLabel: string;
  /** Editorial category from the CMS (e.g. "Analyse"); used as the card kicker. */
  category: string;
  title: string;
  summary: string;
  metaLabel: string;
  /** Reading time in minutes for articles, when known. */
  readingTimeMinutes?: number;
  /** Playback length in whole minutes for episodes/videos, when known. */
  durationMinutes?: number;
  href: string;
  isPremium: boolean;
  coverImageUrl?: string;
  source?: ContentSource;
};

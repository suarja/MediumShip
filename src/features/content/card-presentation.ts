import type { ContentCardModel, ContentKind } from "./types";

/** Editorial format glyph per kind, shared by the hero card and feed rows. */
export const KIND_GLYPH: Record<ContentKind, string> = {
  article: "✎",
  episode: "▷",
  video: "▶",
};

/**
 * Text/glyph colour for content sitting on a premium fill. The premium token is
 * a light gold across every palette, so a near-black reads correctly on it —
 * unlike `accentContrast`, which is tuned for the (often dark) accent fill.
 */
export const PREMIUM_ON_FILL = "#1F1505";

/**
 * Colours for chrome layered directly over cover artwork or video frames — the
 * floating back button, duration pill and play affordance. The artwork behind
 * them is arbitrary, so (like `PREMIUM_ON_FILL`) these are intentionally fixed
 * rather than theme tokens: they must stay legible under every palette.
 */
export const OVER_MEDIA = {
  scrim: "rgba(0, 0, 0, 0.6)",
  scrimSoft: "rgba(0, 0, 0, 0.4)",
  onScrim: "#FFFFFF",
  controlSurface: "rgba(244, 241, 232, 0.95)",
  onControlSurface: "#14110E",
};

/**
 * The home feed namespace translator. Kept structurally loose so the pure
 * helpers below can be unit-friendly and decoupled from i18next's typing.
 */
type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Kicker label for a card: the CMS category, falling back to the format name. */
export function cardKicker(item: ContentCardModel, t: Translate): string {
  const category = item.category?.trim();
  return category && category.length > 0 ? category : t(`kind_${item.kind}`);
}

/**
 * Localized, human meta line: reading time or duration, then a premium tag.
 * Returned unstyled — callers apply uppercase/mono treatment.
 */
export function cardMeta(item: ContentCardModel, t: Translate): string {
  const parts: string[] = [];

  if (item.readingTimeMinutes) {
    parts.push(t("minRead", { count: item.readingTimeMinutes }));
  } else if (item.durationMinutes) {
    parts.push(t("minDuration", { count: item.durationMinutes }));
  }

  if (item.isPremium) {
    parts.push(t("premiumTag"));
  }

  return parts.join(" · ");
}

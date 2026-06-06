/** Predefined category glyphs shared by the mobile app and the CMS picker. */
export const CATEGORY_ICON_CATALOG = [
  { key: "analyses", label: "Analyses", glyph: "✎" },
  { key: "podcasts", label: "Podcasts", glyph: "▷" },
  { key: "videos", label: "Vidéos", glyph: "▶" },
  { key: "agenda", label: "Agenda", glyph: "☷" },
  { key: "collections", label: "Collections", glyph: "◆" },
  { key: "community", label: "Communauté", glyph: "✦" },
  { key: "news", label: "Actualités", glyph: "◎" },
  { key: "economy", label: "Économie", glyph: "◇" },
  { key: "culture", label: "Culture", glyph: "※" },
  { key: "library", label: "Bibliothèque", glyph: "▣" },
  { key: "debate", label: "Débat", glyph: "◈" },
  { key: "film", label: "Film", glyph: "▤" },
  { key: "interview", label: "Entretien", glyph: "◔" },
  { key: "education", label: "Éducation", glyph: "▥" },
  { key: "politics", label: "Politique", glyph: "⚑" },
  { key: "society", label: "Société", glyph: "◐" },
  { key: "science", label: "Science", glyph: "⨁" },
  { key: "default", label: "Générique", glyph: "◉" },
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_CATALOG)[number]["key"];

const GLYPH_BY_KEY = Object.fromEntries(
  CATEGORY_ICON_CATALOG.map((entry) => [entry.key, entry.glyph]),
) as Record<CategoryIconKey, string>;

export function isCategoryIconKey(value: string): value is CategoryIconKey {
  return value in GLYPH_BY_KEY;
}

export function getCategoryIconGlyph(iconKey: string): string {
  if (isCategoryIconKey(iconKey)) {
    return GLYPH_BY_KEY[iconKey];
  }

  return GLYPH_BY_KEY.default;
}

export const CATEGORY_ICON_KEYS = CATEGORY_ICON_CATALOG.map((entry) => entry.key);

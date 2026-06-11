/**
 * Phone-base type sizes (pt). Always multiply by `scaleFont` from `useResponsive()`.
 *
 * These are **floors**, not targets — prefer these roles over ad-hoc `fontSize`
 * literals. Do not go below them for readable UI (list rows, body copy, sheets).
 *
 * See `docs/agents/typography.md`.
 */
export const typeScale = {
  /** Mono kickers, chips, micro-labels — never use for paragraph body. */
  meta: 12,
  /** Secondary lines: subtitles, hints, captions. */
  caption: 14,
  /** Readable body, benefit bullets, sheet intro. */
  body: 16,
  /** Primary list-row / card titles. */
  title: 17,
  /** In-card section headings. */
  section: 22,
  /** Bottom sheets, modals, celebration dialogs. */
  sheetTitle: 26,
  sheetTitleTablet: 28,
  /** Primary CTA labels. */
  cta: 15,
  ctaTablet: 16,
} as const;

export type TypeScaleRole = keyof typeof typeScale;

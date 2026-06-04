/**
 * Font families matching the Civica mockup: Newsreader serif display, Hanken
 * Grotesk body, JetBrains Mono labels. These string names are the family names
 * registered by `useAppFonts` (see `use-app-fonts.ts`), loaded once in the root
 * layout before the app renders. With weight-specific families, set the weight
 * via the family (e.g. `bodyBold`) rather than `fontWeight`.
 */
export const fontFamilies = {
  // Editorial serif for titles/headings.
  display: "Newsreader_600SemiBold",
  displayBold: "Newsreader_700Bold",
  // Italic serif for the brand wordmark and editorial emphasis.
  displayItalic: "Newsreader_600SemiBold_Italic",
  displayBoldItalic: "Newsreader_700Bold_Italic",
  // Grotesk body text.
  body: "HankenGrotesk_400Regular",
  bodyMedium: "HankenGrotesk_500Medium",
  bodySemiBold: "HankenGrotesk_600SemiBold",
  bodyBold: "HankenGrotesk_700Bold",
  // Mono for kickers, chips and meta labels.
  mono: "JetBrainsMono_500Medium",
} as const;

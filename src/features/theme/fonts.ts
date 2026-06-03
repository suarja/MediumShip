import { Platform } from "react-native";

/**
 * Font families echoing the Civica mockup (Newsreader serif display, grotesk
 * body, mono labels). We map to platform system fallbacks for now — no custom
 * font assets are bundled yet — so titles still read as editorial serif and
 * kickers as mono without adding dependencies.
 */
export const fontFamilies = {
  // Editorial serif for titles/headings (mockup: Newsreader).
  display: Platform.select({ ios: "Georgia", default: "serif" }),
  // Mono for kickers, chips and meta labels (mockup: JetBrains Mono).
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
} as const;

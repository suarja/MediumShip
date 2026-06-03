import { contrastRatio } from "../src/features/theme/contrast";
import {
  resolveTheme,
  themePaletteNames,
} from "../src/features/theme/palette-catalog";

// Token pairs that render text on a background somewhere in the UI, with the
// minimum WCAG contrast ratio each must meet across every palette.
// - 4.5 for real reading text (headings, body, summaries, fills with content)
// - 3.0 for decorative/secondary labels (muted meta, accent kickers)
const CHECKS: Array<{
  fg: keyof ReturnType<typeof resolveTheme>["colors"];
  bg: keyof ReturnType<typeof resolveTheme>["colors"];
  min: number;
  label: string;
}> = [
  { fg: "heading", bg: "canvas", min: 4.5, label: "heading on canvas" },
  { fg: "heading", bg: "surface", min: 4.5, label: "heading on surface" },
  { fg: "text", bg: "canvas", min: 4.5, label: "text on canvas" },
  { fg: "text", bg: "surface", min: 4.5, label: "text on surface" },
  { fg: "textMuted", bg: "canvas", min: 3.0, label: "textMuted on canvas" },
  { fg: "textMuted", bg: "surface", min: 3.0, label: "textMuted on surface" },
  // FeaturedCard / detail covers / buttons paint accent fills with this text.
  { fg: "accentContrast", bg: "accent", min: 4.5, label: "accentContrast on accent" },
  // Accent used as kicker labels on surfaces (uppercase, decorative).
  { fg: "accent", bg: "surface", min: 3.0, label: "accent on surface" },
];

describe("palette contrast", () => {
  it("meets WCAG contrast minimums for every palette", () => {
    const violations: string[] = [];

    for (const paletteName of themePaletteNames) {
      const { colors } = resolveTheme({ paletteName });

      for (const check of CHECKS) {
        const ratio = contrastRatio(colors[check.fg], colors[check.bg]);
        if (ratio < check.min) {
          violations.push(
            `${paletteName}: ${check.label} = ${ratio.toFixed(2)}:1 (min ${check.min})`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

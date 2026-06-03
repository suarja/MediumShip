import {
  defaultThemeConfig,
  isThemePaletteName,
  listThemePalettes,
  resolveTheme,
} from "../src/features/theme/palette-catalog";

describe("palette catalog", () => {
  it("resolves the default theme config into a theme", () => {
    const theme = resolveTheme(defaultThemeConfig);

    expect(theme.paletteName).toBe(defaultThemeConfig.paletteName);
    expect(theme.colors.accent.length).toBeGreaterThan(0);
    expect(theme.radii.pill).toBe(999);
  });

  it("exposes only supported palette names", () => {
    const palettes = listThemePalettes();

    expect(palettes.length).toBeGreaterThan(1);
    expect(isThemePaletteName(palettes[0]?.paletteName ?? "")).toBe(true);
    expect(isThemePaletteName("unknown")).toBe(false);
  });
});

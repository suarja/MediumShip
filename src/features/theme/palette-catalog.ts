export const themePaletteNames = [
  "brick",
  "fjord",
  "canopy",
  "midnight",
] as const;

export type ThemePaletteName = (typeof themePaletteNames)[number];

export type ThemeConfig = {
  paletteName: ThemePaletteName;
};

type ThemePaletteDefinition = {
  isDark: boolean;
  colors: {
    canvas: string;
    canvasAccent: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    heading: string;
    text: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    accentContrast: string;
    tabBar: string;
    tabBarCard: string;
    tabInactive: string;
    inputBackground: string;
    overlay: string;
    danger: string;
    dangerSoft: string;
  };
};

export type AppTheme = {
  paletteName: ThemePaletteName;
  isDark: boolean;
  colors: ThemePaletteDefinition["colors"];
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: {
    eyebrow: {
      size: number;
      weight: "700";
      transform: "uppercase";
    };
    title: {
      size: number;
      weight: "700";
    };
    sectionTitle: {
      size: number;
      weight: "700";
    };
    body: {
      size: number;
      lineHeight: number;
    };
    caption: {
      size: number;
      lineHeight: number;
    };
  };
};

export const defaultThemeConfig: ThemeConfig = {
  paletteName: "brick",
};

const paletteCatalog: Record<ThemePaletteName, ThemePaletteDefinition> = {
  brick: {
    isDark: false,
    colors: {
      canvas: "#F5EFE8",
      canvasAccent: "#ECE1D4",
      surface: "#FFFDFC",
      surfaceMuted: "#F8F2EC",
      border: "rgba(87, 56, 36, 0.10)",
      heading: "#2B211D",
      text: "#43332B",
      textMuted: "#7A665C",
      accent: "#B14F2E",
      accentSoft: "#F2DED3",
      accentContrast: "#FFF8F4",
      tabBar: "#EEE2D4",
      tabBarCard: "rgba(255, 252, 247, 0.92)",
      tabInactive: "#8A7468",
      inputBackground: "#FFFCF8",
      overlay: "rgba(43, 33, 29, 0.26)",
      danger: "#A23B2E",
      dangerSoft: "rgba(162, 59, 46, 0.10)",
    },
  },
  fjord: {
    isDark: false,
    colors: {
      canvas: "#EEF4F6",
      canvasAccent: "#DDE9EE",
      surface: "#FCFEFF",
      surfaceMuted: "#F2F8FA",
      border: "rgba(32, 74, 89, 0.10)",
      heading: "#16313A",
      text: "#26454F",
      textMuted: "#5F7A85",
      accent: "#2F7C91",
      accentSoft: "#D7EBF1",
      accentContrast: "#F6FDFF",
      tabBar: "#DCE9ED",
      tabBarCard: "rgba(251, 255, 255, 0.92)",
      tabInactive: "#6C8792",
      inputBackground: "#FAFEFF",
      overlay: "rgba(22, 49, 58, 0.24)",
      danger: "#B44B38",
      dangerSoft: "rgba(180, 75, 56, 0.10)",
    },
  },
  canopy: {
    isDark: false,
    colors: {
      canvas: "#EFF2EA",
      canvasAccent: "#E1E8D6",
      surface: "#FCFDFB",
      surfaceMuted: "#F4F7F0",
      border: "rgba(52, 75, 46, 0.10)",
      heading: "#243321",
      text: "#31412E",
      textMuted: "#687663",
      accent: "#5B7A35",
      accentSoft: "#E3ECD5",
      accentContrast: "#FBFFF5",
      tabBar: "#E1E7D7",
      tabBarCard: "rgba(252, 254, 248, 0.92)",
      tabInactive: "#70806A",
      inputBackground: "#FDFFF9",
      overlay: "rgba(36, 51, 33, 0.22)",
      danger: "#A24A35",
      dangerSoft: "rgba(162, 74, 53, 0.10)",
    },
  },
  midnight: {
    isDark: true,
    colors: {
      canvas: "#0E1520",
      canvasAccent: "#162130",
      surface: "#132030",
      surfaceMuted: "#19283B",
      border: "rgba(214, 225, 236, 0.12)",
      heading: "#F6F8FB",
      text: "#D6E1EC",
      textMuted: "#8FA1B4",
      accent: "#E7A13D",
      accentSoft: "rgba(231, 161, 61, 0.16)",
      accentContrast: "#1D1304",
      tabBar: "#0F1825",
      tabBarCard: "rgba(19, 32, 48, 0.94)",
      tabInactive: "#7E91A6",
      inputBackground: "#162334",
      overlay: "rgba(8, 11, 16, 0.56)",
      danger: "#F28B6A",
      dangerSoft: "rgba(242, 139, 106, 0.14)",
    },
  },
};

export function isThemePaletteName(value: string): value is ThemePaletteName {
  return themePaletteNames.includes(value as ThemePaletteName);
}

export function resolveTheme(config: ThemeConfig): AppTheme {
  const palette = paletteCatalog[config.paletteName] ?? paletteCatalog.brick;

  return {
    paletteName: config.paletteName,
    isDark: palette.isDark,
    colors: palette.colors,
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      xxl: 32,
    },
    radii: {
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
      pill: 999,
    },
    typography: {
      eyebrow: {
        size: 13,
        weight: "700",
        transform: "uppercase",
      },
      title: {
        size: 32,
        weight: "700",
      },
      sectionTitle: {
        size: 18,
        weight: "700",
      },
      body: {
        size: 16,
        lineHeight: 24,
      },
      caption: {
        size: 13,
        lineHeight: 18,
      },
    },
  };
}

export function listThemePalettes() {
  return themePaletteNames.map((paletteName) => ({
    paletteName,
    isDark: paletteCatalog[paletteName].isDark,
    swatches: [
      paletteCatalog[paletteName].colors.accent,
      paletteCatalog[paletteName].colors.surface,
      paletteCatalog[paletteName].colors.heading,
    ],
  }));
}

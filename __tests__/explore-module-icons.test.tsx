import { render, screen } from "@testing-library/react-native";

import ExploreScreen from "../app/(app)/explore";
import { resolveEffectiveFeatureConfigs } from "../convex/featureCatalog";
import { getCategoryIconGlyph } from "../src/features/categories/category-icon-catalog";
import { initI18n } from "../src/i18n";

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

jest.mock("../src/features/categories/use-categories", () => ({
  useCategories: () => ({ categories: [] }),
}));

jest.mock("../src/features/search/use-search", () => ({
  useSearch: () => ({ results: [], isSearching: false }),
}));

jest.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => jest.fn(),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

beforeAll(async () => {
  await initI18n();
});

describe("explore module icons", () => {
  it("renders configured module icons in the grid", () => {
    const featureConfigs = resolveEffectiveFeatureConfigs({
      featureConfigs: {
        collections: { enabled: true, access: "free", iconKey: "film" },
        agenda: { enabled: true, access: "free", iconKey: "agenda" },
        community: { enabled: false, access: "member", iconKey: "community" },
      },
    });

    mockUseAppTheme.mockReturnValue({
      enabledModules: ["collections", "agenda"],
      featureConfigs,
      theme: {
        colors: {
          heading: "#111",
          text: "#111",
          textMuted: "#666",
          border: "#ddd",
          surface: "#fff",
          accent: "#00f",
          canvas: "#fff",
        },
        spacing: { lg: 16, sm: 8, xs: 4 },
        radii: { pill: 99, md: 8 },
        isDark: false,
      },
    });

    render(<ExploreScreen />);

    expect(screen.getByText(getCategoryIconGlyph("film"))).toBeTruthy();
    expect(screen.getByText(getCategoryIconGlyph("agenda"))).toBeTruthy();
    expect(screen.queryByText(getCategoryIconGlyph("community"))).toBeNull();
  });
});

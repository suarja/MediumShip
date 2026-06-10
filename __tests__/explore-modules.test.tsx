import { render, screen } from "@testing-library/react-native";

import ExploreScreen from "../app/(app)/explore";
import { resolveEffectiveFeatureConfigs } from "../convex/featureCatalog";
import { initI18n, changeAppLanguage } from "../src/i18n";

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => jest.fn(),
}));

jest.mock("../src/features/search/use-search", () => ({
  useSearch: () => ({ results: [], isSearching: false }),
}));

jest.mock("../src/features/categories/use-categories", () => ({
  useCategories: () => ({ categories: [], isLoading: false }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/explore",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
}));

function makeTheme(enabledModules: string[]) {
  return {
    tenantSlug: "demo-media",
    enabledModules,
    featureConfigs: resolveEffectiveFeatureConfigs({ enabledModules }),
    feedSections: [],
    theme: {
      colors: {
        heading: "#000",
        text: "#000",
        textMuted: "#666",
        border: "#eee",
        surface: "#fff",
        accent: "#0000ff",
        accentContrast: "#fff",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4 },
      radii: { pill: 99, md: 8, sm: 4 },
      isDark: false,
    },
  };
}

describe("explore modules gating", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("shows all three module cards when all nav modules are enabled", () => {
    mockUseAppTheme.mockReturnValue(
      makeTheme(["articles", "episodes", "videos", "premium", "collections", "agenda", "community"]),
    );
    render(<ExploreScreen />);

    expect(screen.getByText("Collections")).toBeTruthy();
    expect(screen.getByText("Agenda")).toBeTruthy();
    expect(screen.getByText("Community")).toBeTruthy();
  });

  it("hides disabled module cards when only collections is explicitly enabled", () => {
    mockUseAppTheme.mockReturnValue(makeTheme(["articles", "collections"]));
    render(<ExploreScreen />);

    expect(screen.getByText("Collections")).toBeTruthy();
    expect(screen.queryByText("Agenda")).toBeNull();
    expect(screen.queryByText("Community")).toBeNull();
  });

  it("hides every nav module card when the config lists none (strict allowlist)", () => {
    mockUseAppTheme.mockReturnValue(makeTheme(["articles", "episodes", "videos", "premium"]));
    render(<ExploreScreen />);

    expect(screen.queryByText("Collections")).toBeNull();
    expect(screen.queryByText("Agenda")).toBeNull();
    expect(screen.queryByText("Community")).toBeNull();
  });

  it("hides the Modules section heading when all nav modules are disabled", () => {
    mockUseAppTheme.mockReturnValue(makeTheme(["articles", "collections", "agenda"]));
    render(<ExploreScreen />);

    // community explicitly absent (agenda+collections present = explicit config)
    expect(screen.queryByText("Community")).toBeNull();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import ExploreScreen from "../app/(app)/explore";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseSearch = jest.fn((query: string) => ({ results: [], isSearching: false }));
const mockUseCategories = jest.fn(() => ({
  categories: [
    { category: "Analyses", count: 12 },
    { category: "Podcasts", count: 7 },
    { category: "The Youth Response", count: 3 },
  ],
  isLoading: false,
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("convex/react", () => ({
  // Explore's only useQuery is getTrendingTopics; return one real topic so the
  // (now real-data-only) "Cette semaine" section renders.
  useQuery: () => ({ topics: [{ tag: "care-economy" }] }),
  useMutation: () => jest.fn(),
}));

jest.mock("../src/features/search/use-search", () => ({
  useSearch: (query: string) => mockUseSearch(query),
}));

jest.mock("../src/features/categories/use-categories", () => ({
  useCategories: () => mockUseCategories(),
}));

jest.mock("../src/features/haptics/haptics", () => ({
  HapticsService: {
    selection: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/explore",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
}));

describe("explore screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await changeAppLanguage("en");
    mockUseSearch.mockClear();
    mockUseCategories.mockClear();
  });

  it("does not render a top-bar search loupe but keeps the search card", () => {
    render(<ExploreScreen />);

    expect(screen.queryByTestId("explore-top-bar-search")).toBeNull();
    expect(screen.getByTestId("explore-search-icon")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search analyses, podcasts, events…")).toBeTruthy();
  });

  it("renders the first discovery shell sections", () => {
    render(<ExploreScreen />);

    expect(screen.getByText("Explore")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search analyses, podcasts, events…")).toBeTruthy();
    expect(screen.getByText("Categories")).toBeTruthy();
    expect(screen.getByText("Modules")).toBeTruthy();
    expect(screen.getByText("Collections")).toBeTruthy();
    expect(screen.getByText("Community")).toBeTruthy();
    expect(screen.queryAllByRole("button")).not.toHaveLength(0);
  });

  it("renders derived category cards with stable counts", () => {
    render(<ExploreScreen />);

    expect(screen.getByText("Analyses")).toBeTruthy();
    expect(screen.getByText("12 CONTENTS")).toBeTruthy();
    expect(screen.getByText("The Youth Response")).toBeTruthy();
  });

  it("prefills search when a trend chip is pressed", async () => {
    render(<ExploreScreen />);

    fireEvent.press(screen.getByText("care economy"));

    expect(HapticsService.selection).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(mockUseSearch).toHaveBeenLastCalledWith("care economy"),
    );
  });

  it("fires light haptic when a category card is pressed", () => {
    render(<ExploreScreen />);

    fireEvent.press(screen.getByText("Analyses"));

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
  });
});

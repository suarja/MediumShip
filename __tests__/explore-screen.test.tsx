import { render, screen } from "@testing-library/react-native";

import ExploreScreen from "../app/(app)/explore";
import { changeAppLanguage, initI18n } from "../src/i18n";

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
}));

describe("explore screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
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
});

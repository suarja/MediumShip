import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import SettingsScreen from "../app/(app)/settings";
import { initI18n } from "../src/i18n";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const mockApplyCategoryInterests = jest.fn().mockResolvedValue(undefined);

const mockUseCategoryInterests = jest.fn(() => ({
  options: [
    { label: "Science", icon: "⨁", iconKey: "science" },
    { label: "Philosophie", icon: "◉", iconKey: "default" },
    { label: "Culture", icon: "※", iconKey: "culture" },
  ],
  selectedKeys: new Set(["science"]),
  isLoading: false,
  isSignedIn: true,
  canPersistInterests: true,
  applyCategoryInterests: mockApplyCategoryInterests,
}));

jest.mock("../src/features/categories/use-category-interests", () => ({
  useCategoryInterests: () => mockUseCategoryInterests(),
  useCategoryInterestSearch: () => [],
  useCategoryInterestTreeNodes: () => [],
}));

jest.mock("convex/react", () => ({
  useMutation: () => jest.fn().mockResolvedValue(undefined),
  useQuery: () => ({
    name: "Demo Media",
    themeConfig: { paletteName: "brick" },
  }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => false }),
  usePathname: () => "/settings",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isSignedIn: true,
    email: "camille@example.com",
    fullName: "Camille",
    signOut: jest.fn(),
  }),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "online" }),
  useNetworkStatusDebug: () => ({
    override: "auto",
    setOverride: jest.fn(),
  }),
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

describe("category interests picker", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    mockApplyCategoryInterests.mockClear();
    mockUseCategoryInterests.mockImplementation(() => ({
      options: [
        { label: "Science", icon: "⨁", iconKey: "science" },
        { label: "Philosophie", icon: "◉", iconKey: "default" },
        { label: "Culture", icon: "※", iconKey: "culture" },
      ],
      selectedKeys: new Set(["science"]),
      isLoading: false,
      isSignedIn: true,
      canPersistInterests: true,
      applyCategoryInterests: mockApplyCategoryInterests,
    }));
  });

  it("lists tenant categories with current interests pre-selected", async () => {
    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <SettingsScreen />
      </SafeAreaProvider>,
    );

    fireEvent.press(screen.getByText("Category interests"));

    expect(await screen.findByText("Science")).toBeTruthy();
    expect(screen.getByText("Philosophie")).toBeTruthy();
    expect(screen.getByText("Culture")).toBeTruthy();
  });

  it("writes interests and reloads the feed when toggling a category", async () => {
    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <SettingsScreen />
      </SafeAreaProvider>,
    );

    fireEvent.press(screen.getByText("Category interests"));
    fireEvent.press(await screen.findByText("Philosophie"));

    await waitFor(() => {
      expect(mockApplyCategoryInterests).toHaveBeenCalledWith(
        new Set(["philosophie", "science"]),
      );
    });
  });

  it("shows a sign-in affordance for guests without writing", async () => {
    mockUseCategoryInterests.mockImplementation(() => ({
      options: [
        { label: "Science", icon: "⨁", iconKey: "science" },
        { label: "Philosophie", icon: "◉", iconKey: "default" },
      ],
      selectedKeys: new Set<string>(),
      isLoading: false,
      isSignedIn: false,
      canPersistInterests: false,
      applyCategoryInterests: mockApplyCategoryInterests,
    }));

    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <SettingsScreen />
      </SafeAreaProvider>,
    );

    fireEvent.press(screen.getByText("Category interests"));

    expect(await screen.findByText("Sign in to pick categories")).toBeTruthy();
    expect(mockApplyCategoryInterests).not.toHaveBeenCalled();
  });
});

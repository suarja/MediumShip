import { fireEvent, render, screen } from "@testing-library/react-native";

import CategoryScreen from "../app/category/[name]";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockBack = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
  };
});

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: () => ({ name: "Analyses" }),
  useGlobalSearchParams: () => ({}),
  usePathname: () => "/category/Analyses",
  useRouter: () => ({ back: mockBack, replace: jest.fn(), canGoBack: () => true }),
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

describe("category screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockBack.mockReset();
    mockUseQuery.mockReset();
  });

  it("renders the category title and returned content rows", () => {
    mockUseQuery.mockReturnValue([
      {
        _id: "content1",
        kind: "article",
        title: "Care economy",
        summary: "Summary",
        category: "Analyses",
        status: "published",
        slug: "care-economy",
        tags: [],
        isPremium: false,
      },
    ]);

    render(<CategoryScreen />);

    expect(screen.getAllByText("Analyses").length).toBeGreaterThan(0);
    expect(screen.getByText("Care economy")).toBeTruthy();
  });

  it("goes back to Explore when the back button is pressed", () => {
    mockUseQuery.mockReturnValue([]);
    render(<CategoryScreen />);

    fireEvent.press(screen.getByLabelText("Back to Explore"));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(HapticsService.selection).toHaveBeenCalledTimes(1);
  });
});

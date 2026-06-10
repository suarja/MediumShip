import { fireEvent, render, screen } from "@testing-library/react-native";

import ListsScreen from "../app/(app)/lists";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();
const mockPush = jest.fn();
const mockCreateList = jest.fn();

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: () => false,
  }),
  usePathname: () => "/lists",
  useLocalSearchParams: () => ({ returnTo: "/profile" }),
  useGlobalSearchParams: () => ({ returnTo: "/profile" }),
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

jest.mock("../src/features/personal-lists/use-personal-lists", () => ({
  usePersonalLists: () => ({
    lists: [
      {
        _id: "list_1",
        title: "Listen in the car",
        itemCount: 3,
        previewCoverUrls: [
          "https://example.com/cover-1.jpg",
          "https://example.com/cover-2.jpg",
        ],
      },
    ],
    isMember: true,
    isListsLoading: false,
    canCreateAnother: true,
    createList: mockCreateList,
  }),
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall }),
}));

describe("lists screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockOpenPaywall.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockCreateList.mockClear();
    await changeAppLanguage("en");
  });

  it("renders real lists from the hook", () => {
    render(<ListsScreen />);

    expect(screen.getByText("Listen in the car")).toBeTruthy();
    expect(screen.getByText("3 items · private")).toBeTruthy();
    expect(screen.queryByText("This action will be available")).toBeNull();
  });

  it("opens list detail when a row is pressed", () => {
    render(<ListsScreen />);

    fireEvent.press(screen.getByLabelText("Listen in the car"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/list/[id]",
      params: {
        id: "list_1",
        returnTo: "/lists?returnTo=%2Fprofile",
      },
    });
  });

  it("returns to profile when opened from profile", () => {
    render(<ListsScreen />);

    fireEvent.press(screen.getByLabelText("Back"));

    expect(mockReplace).toHaveBeenCalledWith("/profile");
  });
});

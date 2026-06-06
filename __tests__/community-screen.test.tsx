import { render, screen, fireEvent } from "@testing-library/react-native";

import CommunityScreen from "../app/(app)/community";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
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
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

const mockOpenPaywall = jest.fn();

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

jest.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => jest.fn(),
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: "opened" }),
}));

describe("community screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockOpenPaywall.mockClear();
    await changeAppLanguage("fr");
  });

  it("renders hero and community cards", () => {
    render(<CommunityScreen />);

    expect(screen.getByText(/hors de l'app/i)).toBeTruthy();
    expect(screen.getByText("Discord communautaire")).toBeTruthy();
    expect(screen.getByText("Salon membres")).toBeTruthy();
  });

  it("opens paywall when non-member taps Salon membres", () => {
    render(<CommunityScreen />);

    fireEvent.press(screen.getByText("Salon membres"));
    expect(mockOpenPaywall).toHaveBeenCalledWith("members");
  });
});

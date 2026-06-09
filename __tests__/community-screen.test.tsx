import { render, screen, fireEvent } from "@testing-library/react-native";

import CommunityScreen from "../app/(app)/community";
import { resolveEffectiveFeatureConfigs } from "../convex/featureCatalog";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";

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

describe("community screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await changeAppLanguage("fr");
    mockUseAppTheme.mockReturnValue({
      enabledModules: ["community", "membersRoom"],
      featureConfigs: {
        ...resolveEffectiveFeatureConfigs({ enabledModules: ["community", "membersRoom"] }),
        community: { enabled: true, access: "free", iconKey: "community" },
      },
      theme: {
        colors: {
          heading: "#111111",
          text: "#111111",
          textMuted: "#666666",
          border: "#dddddd",
          surface: "#ffffff",
          accent: "#0000ff",
          accentContrast: "#ffffff",
          premium: "#c8964a",
          canvas: "#ffffff",
        },
        spacing: { lg: 16, sm: 8, xs: 4 },
        radii: { pill: 99, md: 8 },
        isDark: false,
      },
    });
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
    expect(HapticsService.medium).toHaveBeenCalledTimes(1);
  });

  it("fires medium haptic on hero CTA and light on free community card", () => {
    render(<CommunityScreen />);

    fireEvent.press(screen.getByText("Rejoindre la communauté"));
    expect(HapticsService.medium).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Discord communautaire"));
    expect(HapticsService.light).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from "@testing-library/react-native";

import EventDetailScreen from "../app/event/[id]";
import { HapticsService } from "../src/features/haptics/haptics";
import type { AppEvent } from "../src/features/events/types";

const mockOpenPaywall = jest.fn();
const mockBack = jest.fn();
const mockUseAccessBadge = jest.fn();

const LOCKED_MEMBER_EVENT: AppEvent = {
  _id: "evt-member",
  title: "Atelier programme 2027",
  summary: "Summary",
  startsAt: "2026-10-02T20:00:00",
  locationLabel: "En visio",
  mode: "online",
  access: "member",
  status: "scheduled",
  ctaLabel: "Rejoindre",
  ctaUrl: "https://example.com/join",
};

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        heading: "#111",
        text: "#111",
        textMuted: "#666",
        border: "#ddd",
        accent: "#20457A",
        accentContrast: "#fff",
        premium: "#c9a227",
      },
      spacing: { lg: 16, md: 12 },
      radii: { pill: 99, lg: 12 },
      isDark: false,
    },
  }),
}));

jest.mock("../src/features/responsive/use-responsive", () => ({
  useResponsive: () => ({ isTablet: false, scaleFont: 1, scaleSpace: 1 }),
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
  useLocalSearchParams: () => ({ id: "evt-member" }),
}));

jest.mock("../src/features/navigation/app-navigation", () => ({
  useGoBack: () => mockBack,
}));

jest.mock("../src/features/events/use-events", () => ({
  useEvent: () => ({ event: LOCKED_MEMBER_EVENT, isLoading: false }),
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

jest.mock("../src/features/tenant/use-access-badge", () => ({
  useAccessBadge: () => mockUseAccessBadge(),
  useContentAccessBadge: jest.fn(),
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
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

describe("event detail screen access badges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a member badge when the event is locked for the current viewer", () => {
    mockUseAccessBadge.mockReturnValue({ show: true, level: "member" });

    render(<EventDetailScreen />);

    expect(screen.getByText("MEMBRES")).toBeTruthy();
  });

  it("hides the access badge when the viewer already has access", () => {
    mockUseAccessBadge.mockReturnValue({ show: false });

    render(<EventDetailScreen />);

    expect(screen.queryByText("MEMBRES")).toBeNull();
    expect(screen.queryByText("PREMIUM")).toBeNull();
    expect(screen.queryByText("GRATUIT")).toBeNull();
  });

  it("opens the members paywall when the locked CTA is pressed", () => {
    mockUseAccessBadge.mockReturnValue({ show: true, level: "member" });

    render(<EventDetailScreen />);
    fireEvent.press(screen.getByText(/Rejoindre/i));

    expect(HapticsService.medium).toHaveBeenCalledTimes(1);
    expect(mockOpenPaywall).toHaveBeenCalledWith("members");
  });

  it("opens the premium paywall when premium content is locked", () => {
    mockUseAccessBadge.mockReturnValue({ show: true, level: "premium" });

    render(<EventDetailScreen />);
    fireEvent.press(screen.getByText(/Rejoindre/i));

    expect(mockOpenPaywall).toHaveBeenCalledWith("content");
  });
});

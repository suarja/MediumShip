import { render, screen, fireEvent } from "@testing-library/react-native";

import AgendaScreen from "../app/(app)/agenda";
import { resolveEffectiveFeatureConfigs } from "../convex/featureCatalog";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));
import type { AppEvent } from "../src/features/events/types";

const MOCK_EVENTS: AppEvent[] = [
  { _id: "evt-1", title: "Assemblée ouverte · Paris", summary: "S", startsAt: "2026-09-24T19:00:00", locationLabel: "La Bellevilloise, Paris · 180 inscrits", mode: "offline", access: "free", status: "scheduled" },
  { _id: "evt-2", title: "Atelier programme 2027", summary: "S", startsAt: "2026-10-02T20:00:00", locationLabel: "En visio · gratuit", mode: "online", access: "member", status: "scheduled" },
  { _id: "evt-3", title: "Débat live", summary: "S", startsAt: "2026-10-11T21:00:00", locationLabel: "YouTube live", mode: "online", access: "free", status: "scheduled" },
  { _id: "evt-4", title: "Cercle local · Lyon", summary: "S", startsAt: "2026-10-18T19:30:00", locationLabel: "Café associatif, Lyon · 24 inscrits", mode: "offline", access: "free", status: "scheduled" },
];

jest.mock("../src/features/events/use-events", () => ({
  useEvents: (filter: string) => {
    const events = MOCK_EVENTS.filter((e) => {
      if (filter === "online") return e.mode === "online" || e.mode === "hybrid";
      if (filter === "local") return e.mode === "offline" || e.mode === "hybrid";
      return true;
    });
    return { events, isLoading: false };
  },
  useEvent: (id: string) => ({ event: MOCK_EVENTS.find((e) => e._id === id), isLoading: false }),
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

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => "/agenda",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
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

const mockUseAccessBadge = jest.fn();

jest.mock("../src/features/tenant/use-access-badge", () => ({
  useAccessBadge: (access: string) => mockUseAccessBadge(access),
  useContentAccessBadge: jest.fn(),
}));

describe("agenda screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    jest.clearAllMocks();
    mockUseAccessBadge.mockImplementation((access: string) => {
      if (access === "member") return { show: true, level: "member" };
      if (access === "premium") return { show: true, level: "premium" };
      return { show: false };
    });
    mockUseAppTheme.mockReturnValue({
      enabledModules: ["agenda"],
      featureConfigs: resolveEffectiveFeatureConfigs({ enabledModules: ["agenda"] }),
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
  });

  it("renders events", () => {
    render(<AgendaScreen />);
    expect(screen.getAllByText(/Paris|Lyon|visio/i).length).toBeGreaterThan(0);
  });

  it("shows filter chips", () => {
    render(<AgendaScreen />);
    expect(screen.getByText("À venir")).toBeTruthy();
    expect(screen.getByText("En ligne")).toBeTruthy();
    expect(screen.getByText("Local")).toBeTruthy();
  });

  it("filters by online mode", () => {
    render(<AgendaScreen />);
    fireEvent.press(screen.getByText("En ligne"));
    expect(screen.getAllByText(/EN LIGNE/i).length).toBeGreaterThan(0);
  });

  it("fires selection haptic when filter chip is pressed", () => {
    render(<AgendaScreen />);
    fireEvent.press(screen.getByText("Local"));
    expect(HapticsService.selection).toHaveBeenCalledTimes(1);
  });

  it("fires light haptic when an event row is pressed", () => {
    render(<AgendaScreen />);
    fireEvent.press(screen.getByText("Assemblée ouverte · Paris"));
    expect(HapticsService.light).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/event/evt-1" }),
    );
  });

  it("shows member access badges only on locked member events", () => {
    render(<AgendaScreen />);

    expect(screen.getByText("MEMBRES")).toBeTruthy();
    expect(screen.queryByText("GRATUIT")).toBeNull();
    expect(screen.queryByText("PREMIUM")).toBeNull();
  });

  it("hides access badges when the viewer already has access", () => {
    mockUseAccessBadge.mockReturnValue({ show: false });

    render(<AgendaScreen />);

    expect(screen.queryByText("MEMBRES")).toBeNull();
    expect(screen.queryByText("PREMIUM")).toBeNull();
    expect(screen.queryByText("GRATUIT")).toBeNull();
  });
});

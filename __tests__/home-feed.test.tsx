import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "../app/(app)/home";
import { changeAppLanguage, initI18n } from "../src/i18n";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const mockUseQuery = jest.fn();
const mockUseNetworkStatus = jest.fn();

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => jest.fn(),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

describe("home feed", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockUseQuery.mockReturnValue([
      {
        _id: "1",
        kind: "article",
        status: "published",
        title: "L'economie du soin",
        summary: "Une analyse",
        category: "Analyse",
        tags: ["analyse"],
        tenantSlug: "demo-media",
        isPremium: false,
        readingTimeMinutes: 18,
      },
    ]);
    mockUseNetworkStatus.mockReturnValue({ state: "online" });
  });

  it("renders published content cards instead of the tenant seed state", () => {
    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <HomeScreen />
      </SafeAreaProvider>,
    );

    expect(screen.getByText("L'economie du soin")).toBeTruthy();
    expect(screen.queryByText(/Seed demo tenant/i)).toBeNull();
  });

  it("shows an offline fallback when the feed has never loaded and the device is offline", () => {
    mockUseQuery.mockReturnValue(undefined);
    mockUseNetworkStatus.mockReturnValue({ state: "offline" });

    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <HomeScreen />
      </SafeAreaProvider>,
    );

    expect(screen.getByText("You are offline")).toBeTruthy();
    expect(screen.getByText("Feed unavailable offline")).toBeTruthy();
    expect(
      screen.getByText("Reconnect to load the public feed for the first time."),
    ).toBeTruthy();
  });
});

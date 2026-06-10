import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import SettingsScreen from "../app/(app)/settings";
import { changeAppLanguage, initI18n, i18n } from "../src/i18n";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false, isLoading: false }),
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

describe("settings language switch", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("fr");
  });

  it("switches the settings screen from French to English", async () => {
    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <SettingsScreen />
      </SafeAreaProvider>,
    );

    expect(screen.getByText("Réglages")).toBeTruthy();
    expect(screen.getByText("Français")).toBeTruthy();

    fireEvent.press(screen.getByText("Français"));
    fireEvent.press(screen.getByText("Anglais"));

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeTruthy();
    });

    expect(i18n.language).toBe("en");
    expect(screen.getAllByText("English").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Manage language and the tenant visual identity."),
    ).toBeTruthy();
  });
});

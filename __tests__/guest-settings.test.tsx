import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import SettingsScreen from "../app/(app)/settings";
import { changeAppLanguage, initI18n } from "../src/i18n";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

jest.mock("convex/react", () => ({
  useMutation: () => jest.fn().mockResolvedValue(undefined),
  useQuery: () => ({
    name: "Demo Media",
    themeConfig: { paletteName: "brick" },
  }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isSignedIn: false,
    email: null,
    fullName: null,
    signOut: jest.fn(),
  }),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "offline" }),
  useNetworkStatusDebug: () => ({
    override: "auto",
    setOverride: jest.fn(),
  }),
}));

describe("guest settings", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("keeps general settings public and removes member-only sign-out actions", () => {
    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <SettingsScreen />
      </SafeAreaProvider>,
    );

    expect(screen.getByText("Language")).toBeTruthy();
    expect(screen.getByText("Palette")).toBeTruthy();
    expect(screen.getByText("Guest")).toBeTruthy();
    expect(screen.getByText("Members only")).toBeTruthy();
    expect(screen.getByText("You are offline")).toBeTruthy();
    expect(screen.getByText("Network state override")).toBeTruthy();
    expect(screen.queryByText("Sign out")).toBeNull();
  });
});

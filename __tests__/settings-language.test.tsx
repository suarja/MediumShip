import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import SettingsScreen from "../app/(app)/settings";
import { changeAppLanguage, initI18n, i18n } from "../src/i18n";

jest.mock("convex/react", () => ({
  useMutation: () => jest.fn().mockResolvedValue(undefined),
  useQuery: () => ({
    name: "Demo Media",
    themeConfig: { paletteName: "brick" },
  }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    email: "camille@example.com",
    fullName: "Camille",
    signOut: jest.fn(),
  }),
}));

describe("settings language switch", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("fr");
  });

  it("switches the settings screen from French to English", async () => {
    render(<SettingsScreen />);

    expect(screen.getByText("Réglages")).toBeTruthy();
    expect(screen.getByText("Français")).toBeTruthy();

    fireEvent.press(screen.getByText("Français"));
    fireEvent.press(screen.getByText("Anglais"));

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeTruthy();
    });

    expect(i18n.language).toBe("en");
    expect(screen.getByText("English")).toBeTruthy();
    expect(
      screen.getByText("Manage language and the tenant visual identity."),
    ).toBeTruthy();
  });
});

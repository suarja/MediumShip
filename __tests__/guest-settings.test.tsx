import { render, screen } from "@testing-library/react-native";

import SettingsScreen from "../app/(app)/settings";
import { changeAppLanguage, initI18n } from "../src/i18n";

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

describe("guest settings", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("keeps general settings public and removes member-only sign-out actions", () => {
    render(<SettingsScreen />);

    expect(screen.getByText("Language")).toBeTruthy();
    expect(screen.getByText("Palette")).toBeTruthy();
    expect(screen.getByText("Guest")).toBeTruthy();
    expect(screen.getByText("Members only")).toBeTruthy();
    expect(screen.queryByText("Sign out")).toBeNull();
  });
});

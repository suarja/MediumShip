import { render, screen } from "@testing-library/react-native";

import { AppTabBar } from "../src/components/navigation/app-tab-bar";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        border: "#DDD",
        heading: "#111",
        surface: "#FFF",
        tabBarCard: "#FFF",
        tabInactive: "#666",
      },
      radii: { lg: 18, xl: 24 },
    },
  }),
}));

describe("app tab bar", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders only the target four visible tabs", () => {
    render(
      <AppTabBar
        descriptors={{
          "home-key": { options: {} },
          "explore-key": { options: {} },
          "library-key": { options: {} },
          "profile-key": { options: {} },
          "premium-key": { options: { href: null } },
          "settings-key": { options: { href: null } },
        } as never}
        navigation={{
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never}
        insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
        state={{
          index: 0,
          key: "tab-state",
          routeNames: [
            "home",
            "explore",
            "library",
            "profile",
            "premium",
            "settings",
          ],
          routes: [
            { key: "home-key", name: "home" },
            { key: "explore-key", name: "explore" },
            { key: "library-key", name: "library" },
            { key: "profile-key", name: "profile" },
            { key: "premium-key", name: "premium" },
            { key: "settings-key", name: "settings" },
          ],
          stale: false,
          type: "tab",
          history: [],
        } as never}
      />,
    );

    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Explore")).toBeTruthy();
    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.queryByText("Premium")).toBeNull();
    expect(screen.queryByText("Settings")).toBeNull();
  });
});

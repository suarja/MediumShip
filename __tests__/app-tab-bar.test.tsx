import { render, screen } from "@testing-library/react-native";

import { AppTabBar } from "../src/components/navigation/app-tab-bar";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../src/features/responsive/use-responsive", () => ({
  useResponsive: () => ({
    isTablet: false,
    scaleFont: 1,
    scaleSpace: 1,
    contentMaxWidth: undefined,
  }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    effectiveNavigation: ["home", "discover", "explore", "library", "profile"],
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

function renderTabBar(
  routes: Array<{ key: string; name: string }>,
  descriptors: Record<string, { options?: { href?: string | null } }> = {},
) {
  render(
    <AppTabBar
      descriptors={Object.fromEntries(
        routes.map((route) => [route.key, descriptors[route.key] ?? { options: {} }]),
      ) as never}
      navigation={{
        emit: jest.fn(() => ({ defaultPrevented: false })),
        navigate: jest.fn(),
      } as never}
      insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
      state={{
        index: 0,
        key: "tab-state",
        routeNames: routes.map((route) => route.name),
        routes,
        stale: false,
        type: "tab",
        history: [],
      } as never}
    />,
  );
}

describe("app tab bar", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders only the target visible tabs with accessibility labels", () => {
    renderTabBar(
      [
        { key: "home-key", name: "home" },
        { key: "discover-key", name: "discover" },
        { key: "explore-key", name: "explore" },
        { key: "library-key", name: "library" },
        { key: "profile-key", name: "profile" },
        { key: "premium-key", name: "premium" },
        { key: "settings-key", name: "settings" },
      ],
      {
        "premium-key": { options: { href: null } },
        "settings-key": { options: { href: null } },
      },
    );

    expect(screen.getByLabelText("Home")).toBeTruthy();
    expect(screen.getByLabelText("Discover")).toBeTruthy();
    expect(screen.getByLabelText("Explore")).toBeTruthy();
    expect(screen.getByLabelText("Library")).toBeTruthy();
    expect(screen.getByLabelText("Profile")).toBeTruthy();
    expect(screen.queryByLabelText("Premium")).toBeNull();
    expect(screen.queryByText("Home")).toBeNull();
    expect(screen.queryByText("Explore")).toBeNull();
  });

  it("filters tabs from effective navigation instead of route registration", () => {
    renderTabBar(
      [
        { key: "home-key", name: "home" },
        { key: "agenda-key", name: "agenda" },
        { key: "community-key", name: "community" },
        { key: "collections-key", name: "collections" },
        { key: "profile-key", name: "profile" },
      ],
      {},
    );

    expect(screen.getByLabelText("Home")).toBeTruthy();
    expect(screen.getByLabelText("Profile")).toBeTruthy();
    expect(screen.queryByLabelText("Agenda")).toBeNull();
    expect(screen.queryByLabelText("Community")).toBeNull();
    expect(screen.queryByLabelText("Collections")).toBeNull();
  });

  it("renders one icon slot per tab without visible captions", () => {
    renderTabBar([
      { key: "home-key", name: "home" },
      { key: "explore-key", name: "explore" },
      { key: "library-key", name: "library" },
      { key: "profile-key", name: "profile" },
    ]);

    expect(screen.getByTestId("tab-icon-home")).toBeTruthy();
    expect(screen.getByTestId("tab-icon-explore")).toBeTruthy();
    expect(screen.getByTestId("tab-icon-library")).toBeTruthy();
    expect(screen.getByTestId("tab-icon-profile")).toBeTruthy();
    expect(screen.queryByText("Library")).toBeNull();
  });
});

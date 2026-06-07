import { render } from "@testing-library/react-native";

import AppLayout from "../app/(app)/_layout";
import {
  buildDefaultNavOrder,
  resolveEffectiveFeatureConfigs,
  resolveEffectiveNavigation,
  type AccessLevel,
  type TenantFeatureConfig,
} from "../convex/featureCatalog";

const mockUseAppTheme = jest.fn();
const mockReplace = jest.fn();
const renderedTabOrder: string[] = [];

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Tabs = ({ children }: { children: React.ReactNode }) => (
    <View testID="tabs">{children}</View>
  );
  Tabs.Screen = ({
    name,
    options,
  }: {
    name: string;
    options?: { href?: string | null };
  }) => {
    renderedTabOrder.push(name);
    return (
      <View
        testID={`tab-${name}`}
        accessibilityLabel={options?.href === null ? "hidden" : "visible"}
      />
    );
  };

  return {
    Tabs,
    usePathname: () => "/home",
    useRouter: () => ({ replace: mockReplace }),
  };
});

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  AppTabBar: () => null,
}));

function mockThemeFromConfigs(
  featureConfigsInput: Record<string, Partial<TenantFeatureConfig> & { enabled: boolean }>,
  navOrder = buildDefaultNavOrder(),
) {
  const featureConfigs = resolveEffectiveFeatureConfigs({ featureConfigs: featureConfigsInput });
  const effectiveNavigation = resolveEffectiveNavigation(featureConfigs, navOrder);
  mockUseAppTheme.mockReturnValue({ featureConfigs, effectiveNavigation });
  return { featureConfigs, effectiveNavigation };
}

describe("app layout feature navigation", () => {
  beforeEach(() => {
    renderedTabOrder.length = 0;
    mockReplace.mockReset();
  });

  it("renders exactly the effective navigation tabs as visible", () => {
    const { effectiveNavigation } = mockThemeFromConfigs({
      home: { enabled: true, access: "free", iconKey: "news" },
      discover: { enabled: true, access: "free", iconKey: "news" },
      explore: { enabled: true, access: "free", iconKey: "default" },
      library: { enabled: true, access: "free", iconKey: "library" },
      profile: { enabled: true, access: "free", iconKey: "default" },
      collections: { enabled: false, access: "free", iconKey: "collections" },
    });

    const { getByTestId } = render(<AppLayout />);

    for (const tab of effectiveNavigation) {
      expect(getByTestId(`tab-${tab}`).props.accessibilityLabel).toBe("visible");
    }
    expect(getByTestId("tab-discover").props.accessibilityLabel).toBe("visible");
  });

  it("hides discover when the table is disabled", () => {
    mockThemeFromConfigs({
      home: { enabled: true, access: "free", iconKey: "news" },
      discover: { enabled: false, access: "free", iconKey: "news" },
      explore: { enabled: true, access: "free", iconKey: "default" },
      library: { enabled: true, access: "free", iconKey: "library" },
      profile: { enabled: true, access: "free", iconKey: "default" },
    });

    const { getByTestId } = render(<AppLayout />);
    expect(getByTestId("tab-discover").props.accessibilityLabel).toBe("hidden");
    expect(getByTestId("tab-home").props.accessibilityLabel).toBe("visible");
    expect(getByTestId("tab-profile").props.accessibilityLabel).toBe("visible");
  });

  it("never shows content or capability modules as tabs", () => {
    mockThemeFromConfigs({
      home: { enabled: true, access: "free", iconKey: "news" },
      profile: { enabled: true, access: "free", iconKey: "default" },
      articles: { enabled: true, access: "free", iconKey: "analyses" },
      bookmarks: {
        enabled: true,
        access: "member" as AccessLevel,
        iconKey: "library",
      },
    });

    const { queryByTestId } = render(<AppLayout />);
    expect(queryByTestId("tab-articles")).toBeNull();
    expect(queryByTestId("tab-bookmarks")).toBeNull();
  });

  it("respects navigation order from effective navigation", () => {
    const navOrder = ["library", "home", "discover", "explore", "profile"];
    const { effectiveNavigation } = mockThemeFromConfigs(
      {
        home: { enabled: true, access: "free", iconKey: "news" },
        discover: { enabled: true, access: "free", iconKey: "news" },
        explore: { enabled: true, access: "free", iconKey: "default" },
        library: { enabled: true, access: "free", iconKey: "library" },
        profile: { enabled: true, access: "free", iconKey: "default" },
      },
      navOrder,
    );

    const { getByTestId } = render(<AppLayout />);
    const visibleOrder = renderedTabOrder.filter(
      (name) => getByTestId(`tab-${name}`).props.accessibilityLabel === "visible",
    );

    expect(visibleOrder).toEqual(effectiveNavigation);
  });
});

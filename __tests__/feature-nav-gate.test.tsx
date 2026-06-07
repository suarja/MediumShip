import { render } from "@testing-library/react-native";

import AppLayout from "../app/(app)/_layout";
import { resolveEffectiveFeatureConfigs } from "../convex/featureCatalog";

const mockUseAppTheme = jest.fn();

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
  }) => (
    <View
      testID={`tab-${name}`}
      accessibilityLabel={options?.href === null ? "hidden" : "visible"}
    />
  );

  return { Tabs };
});

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  AppTabBar: () => null,
}));

describe("app layout feature navigation", () => {
  it("hides discover tab when the feature is disabled", () => {
    const featureConfigs = resolveEffectiveFeatureConfigs({
      featureConfigs: { discover: { enabled: false, access: "free", iconKey: "news" } },
    });

    mockUseAppTheme.mockReturnValue({ featureConfigs });

    const { getByTestId } = render(<AppLayout />);
    expect(getByTestId("tab-discover").props.accessibilityLabel).toBe("hidden");
  });

  it("keeps discover tab visible when the feature is enabled", () => {
    const featureConfigs = resolveEffectiveFeatureConfigs({
      featureConfigs: { discover: { enabled: true, access: "free", iconKey: "news" } },
    });

    mockUseAppTheme.mockReturnValue({ featureConfigs });

    const { getByTestId } = render(<AppLayout />);
    expect(getByTestId("tab-discover").props.accessibilityLabel).toBe("visible");
  });
});

import { Tabs } from "expo-router";

import { AppTabBar } from "../../src/components/navigation/app-tab-bar";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import type { FeatureKey } from "../../convex/featureCatalog";

const ALL_TAB_ROUTE_NAMES = [
  "home",
  "discover",
  "explore",
  "library",
  "profile",
] as const satisfies readonly FeatureKey[];

const DEEP_LINK_ROUTE_NAMES = ["agenda", "community", "collections"] as const;

const HIDDEN_ROUTE_NAMES = ["premium", "settings"] as const;

function tabHref(
  routeName: string,
  effectiveNavigation: readonly FeatureKey[],
): string | null | undefined {
  if (
    (HIDDEN_ROUTE_NAMES as readonly string[]).includes(routeName) ||
    (DEEP_LINK_ROUTE_NAMES as readonly string[]).includes(routeName)
  ) {
    return null;
  }

  if ((ALL_TAB_ROUTE_NAMES as readonly string[]).includes(routeName)) {
    return effectiveNavigation.includes(routeName as FeatureKey) ? undefined : null;
  }

  return null;
}

// Public tab shell: reading surfaces stay available without authentication.
export default function AppLayout() {
  const { effectiveNavigation } = useAppTheme();
  const navSet = new Set(effectiveNavigation);

  const orderedRoutes = [
    ...effectiveNavigation,
    ...ALL_TAB_ROUTE_NAMES.filter((route) => !navSet.has(route)),
    ...DEEP_LINK_ROUTE_NAMES,
    ...HIDDEN_ROUTE_NAMES,
  ];

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {orderedRoutes.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            href: tabHref(name, effectiveNavigation) as null | undefined,
          }}
        />
      ))}
    </Tabs>
  );
}

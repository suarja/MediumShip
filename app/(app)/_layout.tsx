import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { AppTabBar } from "../../src/components/navigation/app-tab-bar";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import type { FeatureKey } from "../../convex/featureCatalog";
import {
  getDefaultAppRoute,
  shouldRedirectTabBoot,
} from "../../src/features/navigation/default-app-route";

const ALL_TAB_ROUTE_NAMES = [
  "home",
  "discover",
  "explore",
  "agenda",
  "community",
  "collections",
  "library",
  "profile",
] as const satisfies readonly FeatureKey[];

const HIDDEN_ROUTE_NAMES = [
  "premium",
  "settings",
  "favorites",
  "downloads",
  "history",
] as const;

function tabHref(
  routeName: string,
  effectiveNavigation: readonly FeatureKey[],
): string | null | undefined {
  if ((HIDDEN_ROUTE_NAMES as readonly string[]).includes(routeName)) {
    return null;
  }

  if ((ALL_TAB_ROUTE_NAMES as readonly string[]).includes(routeName)) {
    return effectiveNavigation.includes(routeName as FeatureKey) ? undefined : null;
  }

  return null;
}

// Public tab shell: reading surfaces stay available without authentication.
export default function AppLayout() {
  const { effectiveNavigation, isLoading } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();
  const bootRedirectHandledRef = useRef(false);
  const navSet = new Set(effectiveNavigation);

  const orderedRoutes = [
    ...effectiveNavigation,
    ...ALL_TAB_ROUTE_NAMES.filter((route) => !navSet.has(route)),
    ...HIDDEN_ROUTE_NAMES,
  ];

  useEffect(() => {
    if (bootRedirectHandledRef.current) {
      return;
    }

    if (isLoading) {
      return;
    }

    if (
      shouldRedirectTabBoot({
        pathname,
        effectiveNavigation,
        allTabRouteNames: ALL_TAB_ROUTE_NAMES,
      })
    ) {
      bootRedirectHandledRef.current = true;
      router.replace(getDefaultAppRoute(effectiveNavigation));
      return;
    }

    bootRedirectHandledRef.current = true;
  }, [effectiveNavigation, isLoading, pathname, router]);

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

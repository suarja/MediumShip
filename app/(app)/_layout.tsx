import { Tabs } from "expo-router";

import { AppTabBar } from "../../src/components/navigation/app-tab-bar";
import { isModuleEnabled } from "../../src/features/tenant/public-config";
import { useAppTheme } from "../../src/features/theme/theme-provider";

// Public tab shell: reading surfaces stay available without authentication.
export default function AppLayout() {
  const { enabledModules } = useAppTheme();
  const discoverHref = isModuleEnabled(enabledModules, "discover") ? undefined : null;

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen
        name="discover"
        options={{
          href: discoverHref,
        }}
      />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="premium" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

import { Tabs } from "expo-router";

import { AppTabBar } from "../../src/components/navigation/app-tab-bar";
import { useAppTheme } from "../../src/features/theme/theme-provider";

// Public tab shell: reading surfaces stay available without authentication.
export default function AppLayout() {
  const { enabledModules } = useAppTheme();
  const hasPremiumModule = enabledModules.includes("premium");

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      {hasPremiumModule ? <Tabs.Screen name="premium" /> : null}
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

import { Tabs } from "expo-router";

import { AppTabBar } from "../../src/components/navigation/app-tab-bar";

// Public tab shell: reading surfaces stay available without authentication.
export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="premium" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

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
      <Tabs.Screen name="premium" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppTabBar } from "../../src/components/navigation/app-tab-bar";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";

// Guard for the authenticated area: bounce to sign-in when not signed in.
export default function AppLayout() {
  const { isLoaded, isSignedIn } = useClerkAuth();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#B42318" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

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

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCFCFD",
  },
});

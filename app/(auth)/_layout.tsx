import { Redirect, Stack } from "expo-router";

import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { getDefaultAppRoute } from "../../src/features/navigation/default-app-route";
import { useAppTheme } from "../../src/features/theme/theme-provider";

// Guard for the auth flow: skip it entirely when already signed in.
export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { effectiveNavigation } = useAppTheme();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href={getDefaultAppRoute(effectiveNavigation)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

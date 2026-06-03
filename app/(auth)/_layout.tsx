import { Redirect, Stack } from "expo-router";

import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";

// Guard for the auth flow: skip it entirely when already signed in.
export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useClerkAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

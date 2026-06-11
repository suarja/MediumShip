import { Redirect } from "expo-router";
import { useAppTheme } from "../src/features/theme/theme-provider";
import { getDefaultAppRoute } from "../src/features/navigation/default-app-route";
import { useOnboardingStatus } from "../src/features/onboarding/use-onboarding-status";

// Public entry: first-run onboarding, then the guest-first app shell.
export default function Index() {
  const { effectiveNavigation } = useAppTheme();
  const onboarding = useOnboardingStatus();

  if (onboarding === "loading") {
    return null;
  }
  if (onboarding === "unseen") {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href={getDefaultAppRoute(effectiveNavigation)} />;
}

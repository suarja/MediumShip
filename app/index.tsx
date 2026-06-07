import { Redirect } from "expo-router";
import { useAppTheme } from "../src/features/theme/theme-provider";
import { getDefaultAppRoute } from "../src/features/navigation/default-app-route";

// Public entry: open the guest-first app shell immediately.
export default function Index() {
  const { effectiveNavigation } = useAppTheme();
  return <Redirect href={getDefaultAppRoute(effectiveNavigation)} />;
}

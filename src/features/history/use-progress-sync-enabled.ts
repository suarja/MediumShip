import { useConvexAuth } from "convex/react";

import { useIsMember } from "../membership/use-is-member";
import { hasCapability } from "../tenant/public-config";
import { useAppTheme } from "../theme/theme-provider";

/** True when remote resume/history queries should run for the signed-in member. */
export function useProgressSyncEnabled(): {
  enabled: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated } = useConvexAuth();
  const { isMember, isLoading } = useIsMember();
  const { enabledModules } = useAppTheme();

  return {
    enabled:
      isAuthenticated &&
      isMember &&
      hasCapability(enabledModules, "progressSync"),
    isLoading,
  };
}

import type { AccessLevel, FeatureKey } from "../../../convex/featureCatalog";
import { useClerkAuth } from "../auth/use-clerk-auth";
import { useIsMember } from "../membership/use-is-member";
import { canAccessFeatureLevel } from "./feature-access";
import { useAppTheme } from "../theme/theme-provider";

export function useFeatureAccess(featureKey: FeatureKey): {
  enabled: boolean;
  access: AccessLevel;
  canAccess: boolean;
  isLoading: boolean;
  requiresSignIn: boolean;
  requiresPremium: boolean;
} {
  const { featureConfigs } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();

  const config = featureConfigs[featureKey];
  const enabled = config?.enabled ?? false;
  const access = config?.access ?? "free";
  // `member` = signed-in (free); `premium` = isPro (deferred → passes). See ADR 0008.
  const accessContext = { isAuthenticated: isSignedIn, isPro: isMember };
  const canAccess = enabled && canAccessFeatureLevel(access, accessContext);
  const requiresSignIn = enabled && access === "member" && !isSignedIn;
  const requiresPremium =
    enabled && access === "premium" && !canAccessFeatureLevel("premium", accessContext);

  return {
    enabled,
    access,
    canAccess,
    isLoading: isMembershipLoading,
    requiresSignIn,
    requiresPremium,
  };
}

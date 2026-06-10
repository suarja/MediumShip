import type { AccessLevel } from "../../../convex/featureCatalog";
import { useClerkAuth } from "../auth/use-clerk-auth";
import { useIsMember } from "../membership/use-is-member";
import {
  resolveAccessBadge,
  resolveContentAccessBadge,
  type AccessBadgeResult,
} from "./access-badge";

export function useAccessBadge(access: AccessLevel): AccessBadgeResult {
  const { isSignedIn } = useClerkAuth();
  const { isMember } = useIsMember();
  return resolveAccessBadge({
    access,
    isAuthenticated: isSignedIn,
    isPro: isMember,
  });
}

export function useContentAccessBadge(isPremium: boolean): AccessBadgeResult {
  const { isSignedIn } = useClerkAuth();
  const { isMember } = useIsMember();
  return resolveContentAccessBadge({
    isPremium,
    isAuthenticated: isSignedIn,
    isPro: isMember,
  });
}

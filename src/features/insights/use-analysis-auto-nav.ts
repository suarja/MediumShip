import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { useClerkAuth } from "../auth/use-clerk-auth";
import { useIsMember } from "../membership/use-is-member";
import { useUnseenAnalysis } from "./use-unseen-analysis";

/**
 * One-shot per session: navigates to the unseen analysis page on app open.
 */
export function useAnalysisAutoNav(enabled: boolean): void {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { analysis, isLoading, canAccess } = useUnseenAnalysis();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!enabled || handledRef.current) {
      return;
    }

    if (!isLoaded || isMembershipLoading || isLoading) {
      return;
    }

    if (!isSignedIn || !isMember || !canAccess || !analysis?._id) {
      handledRef.current = true;
      return;
    }

    handledRef.current = true;
    router.push(`/analysis/${analysis._id}`);
  }, [
    analysis,
    canAccess,
    enabled,
    isLoaded,
    isLoading,
    isMember,
    isMembershipLoading,
    isSignedIn,
    router,
  ]);
}

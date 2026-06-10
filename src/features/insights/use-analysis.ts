import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useIsMember } from "../membership/use-is-member";
import { useFeatureAccess } from "../tenant/use-feature-access";

export function useAnalysisById(analysisId: Id<"tasteAnalysis"> | null | undefined) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { canAccess, isLoading: isFeatureLoading } = useFeatureAccess("premiumInsights");
  const canQuery = isAuthenticated && isMember && canAccess;
  const markSeen = useMutation(api.insights.mutations.markAnalysisSeen);
  const markedRef = useRef<string | null>(null);

  const analysis = useQuery(
    api.insights.queries.getAnalysisById,
    canQuery && analysisId ? { analysisId } : "skip",
  );

  useEffect(() => {
    if (!analysis?._id || analysis.seenAt !== undefined) {
      return;
    }

    if (markedRef.current === analysis._id) {
      return;
    }

    markedRef.current = analysis._id;
    void markSeen({ analysisId: analysis._id });
  }, [analysis, markSeen]);

  return {
    analysis,
    isLoading:
      isAuthLoading || isMembershipLoading || isFeatureLoading || analysis === undefined,
    canAccess: canAccess && isMember,
  };
}

export function useTodayAnalysis() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { canAccess, isLoading: isFeatureLoading } = useFeatureAccess("premiumInsights");
  const canQuery = isAuthenticated && isMember && canAccess;

  const analysis = useQuery(
    api.insights.queries.getTodayAnalysis,
    canQuery ? {} : "skip",
  );

  return {
    analysis,
    isLoading:
      isAuthLoading || isMembershipLoading || isFeatureLoading || analysis === undefined,
    canAccess: canAccess && isMember,
    isMember,
  };
}

export function useAnalysisHistory() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { canAccess, isLoading: isFeatureLoading } = useFeatureAccess("premiumInsights");
  const canQuery = isAuthenticated && isMember && canAccess;

  const analyses = useQuery(
    api.insights.queries.listMyAnalyses,
    canQuery ? {} : "skip",
  );

  return {
    analyses: analyses ?? [],
    isLoading:
      isAuthLoading || isMembershipLoading || isFeatureLoading || analyses === undefined,
    canAccess: canAccess && isMember,
  };
}

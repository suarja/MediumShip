import { useConvexAuth, useQuery } from "convex/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../../../convex/_generated/api";
import { scheduleAnalysisReadyNotification } from "../notifications/schedule-analysis-ready";
import { useIsMember } from "../membership/use-is-member";
import { useFeatureAccess } from "../tenant/use-feature-access";

export function useUnseenAnalysis() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { canAccess, isLoading: isFeatureLoading } = useFeatureAccess("premiumInsights");
  const canQuery = isAuthenticated && isMember && canAccess;
  const { t } = useTranslation("insights");

  const analysis = useQuery(
    api.insights.queries.getUnseenAnalysis,
    canQuery ? {} : "skip",
  );

  useEffect(() => {
    if (!analysis?._id || analysis.seenAt !== undefined) {
      return;
    }

    void scheduleAnalysisReadyNotification({
      analysisId: analysis._id,
      title: t("notification.title"),
      body: t("notification.body"),
    });
  }, [analysis, t]);

  return {
    analysis,
    isLoading:
      isAuthLoading || isMembershipLoading || isFeatureLoading || analysis === undefined,
    canAccess: canAccess && isMember,
  };
}

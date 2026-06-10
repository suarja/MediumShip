import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useIsMember } from "../membership/use-is-member";
import { useFeatureAccess } from "../tenant/use-feature-access";
import { formatDayKey } from "./day-key";

function useLocalDayKey(): string {
  const [dayKey, setDayKey] = useState(() => formatDayKey(Date.now()));

  useEffect(() => {
    const sync = () => {
      const next = formatDayKey(Date.now());
      setDayKey((current) => (current === next ? current : next));
    };

    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        sync();
      }
    });

    return () => subscription.remove();
  }, []);

  return dayKey;
}

function useBriefingQueryGate() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { canAccess, isLoading: isFeatureLoading } = useFeatureAccess("premiumInsights");
  const canQuery = isAuthenticated && isMember && canAccess;

  return {
    canQuery,
    canAccess: canAccess && isMember,
    isLoading: isAuthLoading || isMembershipLoading || isFeatureLoading,
  };
}

function queryResultLoading(
  canQuery: boolean,
  gateLoading: boolean,
  data: unknown,
): boolean {
  return gateLoading || (canQuery && data === undefined);
}

export type ProfileBriefingPreview = {
  _id: Id<"tasteAnalysis">;
  dayKey: string;
  tasteText: string;
  reflection?: string;
  trends?: string;
  createdAt: number;
  seenAt?: number;
};

export function useAnalysisById(analysisId: Id<"tasteAnalysis"> | null | undefined) {
  const { canQuery, canAccess, isLoading: isGateLoading } = useBriefingQueryGate();
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
    isLoading: queryResultLoading(canQuery, isGateLoading, analysis),
    canAccess,
  };
}

export function useTodayAnalysis() {
  const dayKey = useLocalDayKey();
  const { canQuery, canAccess, isLoading: isGateLoading } = useBriefingQueryGate();

  const analysis = useQuery(
    api.insights.queries.getTodayAnalysis,
    canQuery ? { dayKey } : "skip",
  );

  return {
    analysis,
    dayKey,
    isLoading: queryResultLoading(canQuery, isGateLoading, analysis),
    canAccess,
    isMember: canAccess,
  };
}

/** Most recent briefing — reactive when cron inserts a new row. */
export function useLatestBriefing() {
  const { canQuery, canAccess, isLoading: isGateLoading } = useBriefingQueryGate();

  const analysis = useQuery(
    api.insights.queries.getLatestAnalysis,
    canQuery ? {} : "skip",
  );

  return {
    analysis,
    isLoading: queryResultLoading(canQuery, isGateLoading, analysis),
    canAccess,
  };
}

/**
 * Profile card: today's full briefing, else the newest history summary.
 * `listMyAnalyses` is reactive when cron inserts — no extra query needed.
 */
export function useProfileBriefing() {
  const { analysis: todayAnalysis, isLoading: isTodayLoading, canAccess } =
    useTodayAnalysis();
  const { analyses, isLoading: isHistoryLoading } = useAnalysisHistory();

  const historyLatest = analyses[0];
  const analysis: ProfileBriefingPreview | null =
    todayAnalysis ??
    (historyLatest
      ? {
          _id: historyLatest._id,
          dayKey: historyLatest.dayKey,
          tasteText: historyLatest.tasteText,
          createdAt: historyLatest.createdAt,
          seenAt: historyLatest.seenAt,
        }
      : null);

  const isLoading = isTodayLoading || isHistoryLoading;

  return {
    analysis,
    hasUnseen: analysis?.seenAt === undefined,
    isLoading,
    canAccess,
  };
}

export function useAnalysisHistory() {
  const { canQuery, canAccess, isLoading: isGateLoading } = useBriefingQueryGate();

  const analyses = useQuery(
    api.insights.queries.listMyAnalyses,
    canQuery ? {} : "skip",
  );

  return {
    analyses: analyses ?? [],
    isLoading: queryResultLoading(canQuery, isGateLoading, analyses),
    canAccess,
  };
}

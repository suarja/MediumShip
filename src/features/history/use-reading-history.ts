import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { useProgressSyncEnabled } from "./use-progress-sync-enabled";

export function useReadingHistory() {
  const { enabled, isLoading: isGateLoading } = useProgressSyncEnabled();
  const clearReadingHistory = useMutation(
    api.readingHistory.mutations.clearReadingHistory,
  );

  const data = useQuery(
    api.readingHistory.queries.getReadingHistory,
    enabled ? {} : "skip",
  );

  return {
    data: enabled && Array.isArray(data) ? data : [],
    isLoading: enabled && (isGateLoading || data === undefined),
    clearReadingHistory,
  };
}

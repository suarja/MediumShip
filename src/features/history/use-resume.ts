import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { useProgressSyncEnabled } from "./use-progress-sync-enabled";

export function useResume(options?: { enabled?: boolean }) {
  const { enabled: gateEnabled, isLoading: isGateLoading } =
    useProgressSyncEnabled();
  const enabled = (options?.enabled ?? true) && gateEnabled;

  const data = useQuery(
    api.readingHistory.queries.getResume,
    enabled ? {} : "skip",
  );

  return {
    data: enabled ? (data ?? null) : null,
    isLoading: enabled && (isGateLoading || data === undefined),
  };
}

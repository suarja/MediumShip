import { useMutation, useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  engagementSignals,
  type ConsumptionSnapshot,
  type ContentKind,
} from "../../../convex/discovery/engagement";
import { useAppTheme } from "../theme/theme-provider";

/** Session-scoped guard so re-opening a finished detail does not re-emit finish. */
const finishedContentIds = new Set<string>();

/** Test-only reset for session-scoped engagement guards. */
export function resetContentEngagementSessionForTests(): void {
  finishedContentIds.clear();
}

/**
 * Records one-shot open/finish discovery signals for a content detail surface.
 * Guests are no-ops; repeats are idempotent server-side.
 */
export function useContentEngagement(args: {
  contentId: Id<"contents"> | undefined;
  kind: ContentKind | undefined;
  enabled?: boolean;
  recordOpen?: boolean;
  consumption?: ConsumptionSnapshot;
}): void {
  const { tenantSlug } = useAppTheme();
  const { isAuthenticated } = useConvexAuth();
  const recordInteraction = useMutation(api.discovery.interactions.recordInteraction);
  const openRecordedRef = useRef(false);
  const finishRecordedRef = useRef(false);

  const enabled = args.enabled ?? true;
  const recordOpen = args.recordOpen ?? true;

  useEffect(() => {
    openRecordedRef.current = false;
    finishRecordedRef.current = false;
  }, [args.contentId]);

  useEffect(() => {
    if (!enabled || !recordOpen || !isAuthenticated || !args.contentId) {
      return;
    }

    if (openRecordedRef.current) {
      return;
    }

    openRecordedRef.current = true;
    void recordInteraction({
      tenantSlug,
      contentId: args.contentId,
      type: "open",
    });
  }, [args.contentId, enabled, isAuthenticated, recordInteraction, recordOpen, tenantSlug]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !args.contentId || !args.kind) {
      return;
    }

    if (
      finishRecordedRef.current ||
      finishedContentIds.has(args.contentId)
    ) {
      return;
    }

    const signals = engagementSignals(args.kind, args.consumption ?? {});
    if (!signals.includes("finish")) {
      return;
    }

    finishRecordedRef.current = true;
    finishedContentIds.add(args.contentId);
    void recordInteraction({
      tenantSlug,
      contentId: args.contentId,
      type: "finish",
    });
  }, [
    args.consumption,
    args.contentId,
    args.kind,
    enabled,
    isAuthenticated,
    recordInteraction,
    tenantSlug,
  ]);
}

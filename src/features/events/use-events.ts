import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { tryParseConvexId } from "../convex/parse-id";
import { useAppTheme } from "../theme/theme-provider";
import type { AppEvent, EventFilter } from "./types";

export function useEvents(filter: EventFilter): { events: AppEvent[]; isLoading: boolean } {
  const { tenantSlug } = useAppTheme();
  const data = useQuery(api.events.queries.listPublishedEvents, { tenantSlug, filter });

  return {
    events: data ?? [],
    isLoading: data === undefined,
  };
}

export function useEvent(id: string): { event?: AppEvent; isLoading: boolean } {
  const convexId = tryParseConvexId<"events">(id);
  const data = useQuery(
    api.events.queries.getPublishedEventById,
    convexId ? { id: convexId } : "skip",
  );

  return {
    event: convexId ? (data ?? undefined) : undefined,
    isLoading: convexId ? data === undefined : false,
  };
}

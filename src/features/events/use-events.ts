import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
  const data = useQuery(
    api.events.queries.getPublishedEventById,
    id ? { id: id as Id<"events"> } : "skip",
  );

  return {
    event: data ?? undefined,
    isLoading: data === undefined,
  };
}

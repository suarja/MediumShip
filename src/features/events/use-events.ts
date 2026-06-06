// Slice 3: fixture-backed. Slice 4 swaps the body to a Convex query; the return shape is the contract — do not change it here.
import type { AppEvent, EventFilter } from "./types";
import { FIXTURE_EVENTS } from "./fixtures";

export function useEvents(filter: EventFilter): { events: AppEvent[]; isLoading: boolean } {
  const filtered = FIXTURE_EVENTS.filter((e) => {
    if (filter === "online") return e.mode === "online" || e.mode === "hybrid";
    if (filter === "local") return e.mode === "offline" || e.mode === "hybrid";
    return true;
  });

  return { events: filtered, isLoading: false };
}

export function useEvent(id: string): { event?: AppEvent; isLoading: boolean } {
  return { event: FIXTURE_EVENTS.find((e) => e._id === id), isLoading: false };
}

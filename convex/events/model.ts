import type { Doc } from "../_generated/dataModel";
import type { AppEvent, EventFilter } from "../../src/features/events/types";

export function filterEvents<
  T extends { startsAt: string; mode: "online" | "offline" | "hybrid" },
>(events: T[], filter: EventFilter, nowIso: string): T[] {
  return events.filter((e) => {
    if (filter === "upcoming") return e.startsAt >= nowIso;
    if (filter === "online") return e.mode === "online" || e.mode === "hybrid";
    if (filter === "local") return e.mode === "offline" || e.mode === "hybrid";
    return true;
  });
}

export function sortByStartsAt<T extends { startsAt: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function toAppEvent(doc: Doc<"events">): AppEvent {
  return {
    _id: doc._id,
    title: doc.title,
    summary: doc.summary,
    startsAt: doc.startsAt,
    locationLabel: doc.locationLabel,
    mode: doc.mode,
    access: doc.access,
    status: doc.status,
    coverImageUrl: doc.coverImageUrl,
    ctaLabel: doc.ctaLabel,
    ctaUrl: doc.ctaUrl,
    communityUrl: doc.communityUrl,
    descriptionLong: doc.descriptionLong,
  };
}

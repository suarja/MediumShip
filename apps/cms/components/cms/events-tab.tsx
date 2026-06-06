"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";

import { EventForm } from "./event-form";
import { EventList, type EventStatusFilter } from "./event-list";

type EventsTabProps = {
  items: Doc<"events">[];
  onCreate: () => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
};

function matchesQuery(item: Doc<"events">, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [item.title, item.slug, item.summary, item.locationLabel]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export function EventsTab({
  items,
  onCreate,
  onSelect,
  selectedId,
}: EventsTabProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");

  const counts = useMemo<Record<EventStatusFilter, number>>(
    () =>
      items.reduce(
        (acc, item) => {
          acc.all += 1;
          acc[item.status] += 1;
          return acc;
        },
        { all: 0, scheduled: 0, archived: 0 },
      ),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }

        return matchesQuery(item, query);
      }),
    [items, query, statusFilter],
  );

  useEffect(() => {
    if (filteredItems.length === 0) {
      if (selectedId !== null) {
        onSelect(null);
      }
      return;
    }

    if (!selectedId || !filteredItems.some((item) => item._id === selectedId)) {
      onSelect(filteredItems[0]._id);
    }
  }, [filteredItems, onSelect, selectedId]);

  return (
    <main className="page">
      <div className="contents-grid">
        <EventList
          counts={counts}
          items={filteredItems}
          onCreate={onCreate}
          onQueryChange={setQuery}
          onSelect={onSelect}
          onStatusFilterChange={setStatusFilter}
          query={query}
          selectedId={selectedId}
          statusFilter={statusFilter}
        />

        <EventForm key={selectedId ?? "none"} selectedId={selectedId} />
      </div>
    </main>
  );
}

"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";

import { CollectionForm } from "./collection-form";
import { CollectionList, type EditorialStatusFilter } from "./collection-list";

type CollectionsTabProps = {
  items: Doc<"collections">[];
  onCreate: () => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
};

function matchesQuery(item: Doc<"collections">, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [item.title, item.slug, item.summary].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export function CollectionsTab({
  items,
  onCreate,
  onSelect,
  selectedId,
}: CollectionsTabProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<EditorialStatusFilter>("all");

  const counts = useMemo<Record<EditorialStatusFilter, number>>(
    () =>
      items.reduce(
        (acc, item) => {
          acc.all += 1;
          acc[item.status] += 1;
          return acc;
        },
        { all: 0, published: 0, draft: 0, archived: 0 },
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
        <CollectionList
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

        <CollectionForm key={selectedId ?? "none"} selectedId={selectedId} />
      </div>
    </main>
  );
}

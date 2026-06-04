"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";

import {
  EditorialList,
  type EditorialStatusFilter,
} from "./editorial-list";
import { ContentForm } from "./content-form";
import { PreviewPane } from "./preview-pane";

type ContentsTabProps = {
  items: Doc<"contents">[];
  onCreate: (kind: "article" | "episode" | "video") => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
};

function matchesQuery(item: Doc<"contents">, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [
    item.title,
    item.slug,
    item.summary,
    item.category,
    item.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

export function ContentsTab({
  items,
  onCreate,
  onSelect,
  selectedId,
}: ContentsTabProps) {
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
        if (
          statusFilter !== "all" &&
          item.status !== statusFilter
        ) {
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
        <EditorialList
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

        <ContentForm key={selectedId ?? "none"} selectedId={selectedId} />

        <div className="col-preview">
          <PreviewPane key={`preview-${selectedId ?? "none"}`} selectedId={selectedId} />
        </div>
      </div>
    </main>
  );
}

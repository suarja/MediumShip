"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";

import { CategoryForm } from "./category-form";
import { CategoryList } from "./category-list";

type CategoriesTabProps = {
  items: Doc<"categories">[];
  onCreate: () => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
};

function matchesQuery(item: Doc<"categories">, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [item.label, item.slug, item.iconKey].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export function CategoriesTab({
  items,
  onCreate,
  onSelect,
  selectedId,
}: CategoriesTabProps) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(
    () => items.filter((item) => matchesQuery(item, query)),
    [items, query],
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
        <CategoryList
          items={filteredItems}
          onCreate={onCreate}
          onQueryChange={setQuery}
          onSelect={onSelect}
          query={query}
          selectedId={selectedId}
        />

        <CategoryForm key={selectedId ?? "none"} selectedId={selectedId} />
      </div>
    </main>
  );
}

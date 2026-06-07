"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";

import { CatalogSearchPanel } from "./catalog-search-panel";
import { CategoryForm } from "./category-form";
import { CategoryList } from "./category-list";

type CategoriesTabProps = {
  items: Doc<"categories">[];
  ready: boolean;
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

function sortAlphabetically(items: Doc<"categories">[]) {
  return [...items].sort((left, right) => left.label.localeCompare(right.label, "fr"));
}

export function CategoriesTab({
  items,
  ready,
  onCreate,
  onSelect,
  selectedId,
}: CategoriesTabProps) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(
    () => sortAlphabetically(items.filter((item) => matchesQuery(item, query))),
    [items, query],
  );

  // Keep selection only when the chosen row is still visible.
  // Never auto-pick the first row — the editor opens only after an explicit list click.
  useEffect(() => {
    if (filteredItems.length === 0) {
      if (selectedId !== null) {
        onSelect(null);
      }
      return;
    }

    if (selectedId && !filteredItems.some((item) => item._id === selectedId)) {
      onSelect(null);
    }
  }, [filteredItems, onSelect, selectedId]);

  return (
    <main className="page">
      <div className="contents-grid categories-layout">
        <CategoryList
          items={filteredItems}
          onCreate={onCreate}
          onQueryChange={setQuery}
          onSelect={onSelect}
          query={query}
          selectedId={selectedId}
        />

        <div className="categories-right-stack">
          {selectedId ? (
            <CategoryForm key={selectedId} selectedId={selectedId} />
          ) : null}
          <CatalogSearchPanel ready={ready} />
        </div>
      </div>
    </main>
  );
}

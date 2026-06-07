"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CatalogSearchPanel } from "./catalog-search-panel";
import { CategoryForm } from "./category-form";
import { CategoryList } from "./category-list";

type CategoriesTabProps = {
  items: Doc<"categories">[];
  ready: boolean;
  onCreate: () => Promise<string>;
};

function matchesQuery(item: Doc<"categories">, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [item.label, item.slug, item.iconKey].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export function CategoriesTab({ items, ready, onCreate }: CategoriesTabProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesQuery(item, query)),
    [items, query],
  );

  useEffect(() => {
    if (selectedId && !filteredItems.some((item) => item._id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredItems, selectedId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  const handleCreate = useCallback(async () => {
    const id = await onCreate();
    setSelectedId(id);
  }, [onCreate]);

  return (
    <main className="page">
      <div className="contents-grid categories-layout">
        <CategoryList
          items={filteredItems}
          onCreate={() => void handleCreate()}
          onQueryChange={setQuery}
          onSelect={handleSelect}
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

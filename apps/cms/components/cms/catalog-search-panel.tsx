"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { CatalogSearchResults } from "./catalog-search-results";

type CatalogSearchPanelProps = {
  ready: boolean;
};

export function CatalogSearchPanel({ ready }: CatalogSearchPanelProps) {
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (value: string) => {
    setRawQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(value), 300);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const isEmpty = !debouncedQuery.trim();

  const searchResults = useQuery(
    api.cms.catalog.searchCategoryCatalogForCms,
    !ready || isEmpty ? "skip" : { query: debouncedQuery },
  );

  const tenantCategories = useQuery(
    api.cms.categories.listCmsCategories,
    ready ? {} : "skip",
  );
  const tenantSlugs = useMemo(
    () => new Set((tenantCategories ?? []).map((c) => c.slug)),
    [tenantCategories],
  );

  const addFromCatalog = useMutation(api.cms.categories.addCategoryFromCatalog);

  const handleAdd = useCallback(
    async (catalogNodeId: string, includeDescendants: boolean) => {
      return await addFromCatalog({
        catalogNodeId: catalogNodeId as never,
        includeDescendants,
      });
    },
    [addFromCatalog],
  );

  const showResults = ready && !isEmpty && searchResults !== undefined;

  return (
    <section className="panel dev-panel catalog-search-panel">
      <div className="panel-header">
        <div>
          <p className="page__crumb">Réservoir IPTC</p>
          <h2 className="panel-title">Ajouter depuis le catalogue</h2>
        </div>
      </div>

      <p className="empty-copy">
        Cherche un sous-thème précis (niveau 2+). Les racines IPTC sont trop
        larges et ne peuvent pas être ajoutées au tenant.
      </p>

      <div className="dev-search-bar">
        <input
          className="dev-search-input"
          disabled={!ready}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Rechercher — ex. économie, sport, politique…"
          type="search"
          value={rawQuery}
        />
      </div>

      {showResults && searchResults.length === 0 && (
        <p className="empty-copy">Aucun résultat pour « {debouncedQuery} ».</p>
      )}

      {showResults && searchResults.length > 0 && (
        <CatalogSearchResults
          nodes={searchResults}
          onAdd={handleAdd}
          tenantSlugs={tenantSlugs}
        />
      )}

      {ready && !showResults && isEmpty && (
        <p className="empty-copy">
          Tape un terme pour parcourir le réservoir global IPTC.
        </p>
      )}
    </section>
  );
}

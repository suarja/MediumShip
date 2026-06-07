"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { CatalogSearchResults } from "./catalog-search-results";

type CatalogSearchPanelProps = {
  ready: boolean;
};

export function CatalogSearchPanel({ ready }: CatalogSearchPanelProps) {
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [localeError, setLocaleError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locales = useQuery(api.cms.catalog.getDiscoveryLocales, ready ? {} : "skip");
  const stats = useQuery(api.cms.catalog.getCategoryCatalogStats, ready ? {} : "skip");
  const roots = useQuery(
    api.cms.catalog.listCategoryCatalogRootsForCms,
    ready ? {} : "skip",
  );
  const updateLocales = useMutation(api.cms.catalog.updateDiscoveryLocales);

  const catalogLocale = locales?.catalogLocale ?? "en";

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

  const addFromCatalog = useMutation(api.cms.categories.addCategoryFromCatalog);
  const removeFromCatalog = useMutation(api.cms.categories.removeCategoryFromCatalog);

  const handleToggle = useCallback(
    async (catalogNodeId: string, mode: "self" | "descendants", remove: boolean) => {
      if (remove) {
        await removeFromCatalog({
          catalogNodeId: catalogNodeId as never,
          includeDescendants: mode === "descendants",
          excludeSelf: mode === "descendants",
        });
        return;
      }

      await addFromCatalog({
        catalogNodeId: catalogNodeId as never,
        includeDescendants: mode === "descendants",
      });
    },
    [addFromCatalog, removeFromCatalog],
  );

  const handleLocaleChange = async (next: "en" | "fr") => {
    if (next === catalogLocale) return;
    setLocaleError(null);
    try {
      await updateLocales({ catalogLocale: next });
    } catch (err) {
      setLocaleError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  const showChips = ready && isEmpty && roots && roots.length > 0;
  const showResults = ready && !isEmpty && searchResults !== undefined;
  const missingFrench =
    catalogLocale === "fr" &&
    stats !== undefined &&
    stats.total > 0 &&
    stats.withFrench === 0;

  return (
    <section className="catalog-reservoir editor">
      <article className="editor__card catalog-reservoir__card">
        <header className="catalog-reservoir__head">
          <div>
            <p className="editor__crumb">
              Réservoir IPTC
              <span className="sep">·</span>
              global
            </p>
            <h2 className="catalog-reservoir__title">Ajouter à la taxonomie</h2>
            <p className="catalog-reservoir__lead">
              Parcours les familles IPTC, puis ajoute un sous-thème précis. Les
              familles courtes (un ou deux mots) peuvent être ajoutées
              directement ; les familles trop larges servent seulement
              d&apos;entrée pour explorer.
            </p>
          </div>

          <div
            aria-label="Langue d'affichage du catalogue"
            className="catalog-locale-switch"
            role="group"
          >
            <button
              aria-pressed={catalogLocale === "fr"}
              className={`catalog-locale-switch__btn${catalogLocale === "fr" ? " is-active" : ""}`}
              disabled={!ready}
              onClick={() => void handleLocaleChange("fr")}
              type="button"
            >
              FR
            </button>
            <button
              aria-pressed={catalogLocale === "en"}
              className={`catalog-locale-switch__btn${catalogLocale === "en" ? " is-active" : ""}`}
              disabled={!ready}
              onClick={() => void handleLocaleChange("en")}
              type="button"
            >
              EN
            </button>
          </div>
        </header>

        {missingFrench && (
          <p className="catalog-reservoir__hint catalog-reservoir__hint--warn">
            Libellés français absents — lance un réimport IPTC dans
            l&apos;onglet Développeur (une fois suffit).
          </p>
        )}

        {localeError && (
          <p className="catalog-reservoir__hint catalog-reservoir__hint--error">
            {localeError}
          </p>
        )}

        <div className="dev-search-bar">
          <input
            className="dev-search-input"
            disabled={!ready}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={
              catalogLocale === "fr"
                ? "Rechercher — ex. économie, sport, politique…"
                : "Search — e.g. economy, sport, politics…"
            }
            type="search"
            value={rawQuery}
          />
        </div>

        {showChips && (
          <div className="catalog-reservoir__chips">
            <p className="catalog-reservoir__chips-label">Familles de base</p>
            <div className="dev-root-chips">
              {roots.map((root) => (
                <button
                  className="chip chip--browse"
                  key={root._id}
                  onClick={() => handleQueryChange(root.displayLabel)}
                  title={
                    root.canAdd
                      ? "Explorer ou ajouter cette famille"
                      : "Explorer les sous-thèmes (famille trop large pour ajout direct)"
                  }
                  type="button"
                >
                  {root.displayLabel}
                </button>
              ))}
            </div>
          </div>
        )}

        {showResults && searchResults.length === 0 && (
          <p className="empty-copy">Aucun sous-thème pour « {debouncedQuery} ».</p>
        )}

        {showResults && searchResults.length > 0 && (
          <CatalogSearchResults
            nodes={searchResults}
            onToggle={handleToggle}
          />
        )}

        {ready && !showChips && !showResults && isEmpty && stats?.total === 0 && (
          <p className="empty-copy">
            Catalogue vide — importe d&apos;abord les nœuds IPTC dans
            Développeur.
          </p>
        )}

        {ready && !showChips && !showResults && isEmpty && (stats?.total ?? 0) > 0 && (
          <p className="empty-copy">
            Choisis une famille ci-dessus ou tape un terme de recherche.
          </p>
        )}
      </article>
    </section>
  );
}

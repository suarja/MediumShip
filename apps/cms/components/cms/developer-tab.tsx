"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { CatalogSearchResults } from "./catalog-search-results";

// ── Import IPTC panel ──────────────────────────────────────────────────────────

function IptcImportPanel() {
  const stats = useQuery(api.cms.catalog.getCategoryCatalogStats, {});
  const triggerImport = useMutation(api.cms.catalog.triggerIptcImport);

  const [importState, setImportState] = useState<
    "idle" | "triggering" | "pending" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleImport = async () => {
    setImportState("triggering");
    setErrorMsg("");
    try {
      await triggerImport({});
      setImportState("pending");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
      setImportState("error");
    }
  };

  const isEmpty = stats !== undefined && stats.total === 0;
  const hasData = stats !== undefined && stats.total > 0;

  return (
    <section className="panel dev-panel">
      <div className="panel-header">
        <div>
          <p className="page__crumb">Catalogue global</p>
          <h2 className="panel-title">IPTC Media Topics</h2>
        </div>
        {hasData && (
          <div className="catalog-stats">
            <span className="stat-chip">
              <strong>{stats.active}</strong> actifs
            </span>
            <span className="stat-chip stat-chip--muted">
              {stats.retired} retirés
            </span>
          </div>
        )}
      </div>

      {stats === undefined && (
        <p className="empty-copy">Chargement des statistiques…</p>
      )}

      {isEmpty && importState === "idle" && (
        <div className="dev-empty-state">
          <p className="empty-copy">
            Le catalogue est vide. Importe les nœuds IPTC Media Topics pour
            commencer à enrichir la taxonomie tenant.
          </p>
        </div>
      )}

      {hasData && importState === "idle" && (
        <p className="empty-copy">
          Catalogue présent · relance l&apos;import pour mettre à jour.
        </p>
      )}

      {importState === "pending" && (
        <p className="dev-success-copy">
          ✓ Import planifié — les nœuds apparaîtront dans les statistiques dans
          quelques secondes.
        </p>
      )}

      {importState === "error" && (
        <p className="dev-error-copy">
          Erreur : {errorMsg}
        </p>
      )}

      <div className="stack-actions" style={{ marginTop: 16 }}>
        <button
          className="primary-button"
          disabled={importState === "triggering"}
          onClick={() => void handleImport()}
          type="button"
        >
          {importState === "triggering"
            ? "Planification…"
            : isEmpty
              ? "Importer depuis IPTC"
              : "Réimporter depuis IPTC"}
        </button>

        {importState === "error" && (
          <button
            className="ghost-button"
            onClick={() => setImportState("idle")}
            type="button"
          >
            Réessayer
          </button>
        )}
      </div>
    </section>
  );
}

// ── Catalog search panel ───────────────────────────────────────────────────────

function CatalogSearchPanel() {
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (value: string) => {
    setRawQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(value), 300);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const isEmpty = !debouncedQuery.trim();

  const roots = useQuery(api.cms.catalog.listCategoryCatalogRootsForCms, {});
  const searchResults = useQuery(
    api.cms.catalog.searchCategoryCatalogForCms,
    isEmpty ? "skip" : { query: debouncedQuery },
  );

  // Load tenant categories to detect already-present slugs
  const tenantCategories = useQuery(api.cms.categories.listCmsCategories, {});
  const tenantSlugs = useMemo(
    () => new Set((tenantCategories ?? []).map((c) => c.slug)),
    [tenantCategories],
  );

  const addFromCatalog = useMutation(api.cms.categories.addCategoryFromCatalog);

  const handleAdd = useCallback(
    async (catalogNodeId: string, includeDescendants: boolean) => {
      return await addFromCatalog({ catalogNodeId: catalogNodeId as never, includeDescendants });
    },
    [addFromCatalog],
  );

  const showChips = isEmpty && roots && roots.length > 0;
  const showResults = !isEmpty && searchResults !== undefined;

  return (
    <section className="panel dev-panel">
      <div className="panel-header">
        <div>
          <p className="page__crumb">Recherche catalogue</p>
          <h2 className="panel-title">Ajouter à la taxonomie</h2>
        </div>
      </div>

      <div className="dev-search-bar">
        <input
          className="dev-search-input"
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Rechercher — ex. Économie, Sport, Politique…"
          type="search"
          value={rawQuery}
        />
      </div>

      {showChips && (
        <div className="dev-root-chips">
          {roots.map((root) => (
            <button
              className="chip"
              key={root._id}
              onClick={() => handleQueryChange(root.label)}
              type="button"
            >
              {root.label}
            </button>
          ))}
        </div>
      )}

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

      {!showChips && !showResults && isEmpty && (
        <p className="empty-copy">
          Tape un terme pour rechercher dans le catalogue IPTC.
        </p>
      )}
    </section>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────

export function DeveloperTab() {
  return (
    <main className="page">
      <div className="page__head">
        <div>
          <p className="page__crumb">⬡ Espace développeur</p>
          <h1 className="page__title">
            <i>Développeur</i>
          </h1>
          <p className="page__sub">
            Import IPTC · Catalogue global · Enrichissement taxonomie tenant
          </p>
        </div>
      </div>

      <div className="dev-grid">
        <IptcImportPanel />
        <CatalogSearchPanel />
      </div>
    </main>
  );
}

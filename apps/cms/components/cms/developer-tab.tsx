"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";

type ImportState = "idle" | "importing" | "success" | "error";

function DiscoveryLocalesPanel({ ready }: { ready: boolean }) {
  const locales = useQuery(api.cms.catalog.getDiscoveryLocales, ready ? {} : "skip");
  const updateLocales = useMutation(api.cms.catalog.updateDiscoveryLocales);
  const [catalogLocale, setCatalogLocale] = useState<"en" | "fr">("en");
  const [wikipediaLocale, setWikipediaLocale] = useState<"en" | "fr">("en");
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!locales) return;
    setCatalogLocale(locales.catalogLocale);
    setWikipediaLocale(locales.wikipediaLocale);
  }, [locales]);

  const handleSave = async () => {
    setErrorMsg(null);
    try {
      await updateLocales({ catalogLocale, wikipediaLocale });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  return (
    <section className="panel dev-panel">
      <div className="panel-header">
        <div>
          <p className="page__crumb">Langues discovery</p>
          <h2 className="panel-title">Catalogue & Wikipedia</h2>
        </div>
      </div>

      <p className="empty-copy">
        L&apos;import IPTC charge EN + FR en une passe. Le choix de langue
        ci-dessous change l&apos;affichage immédiatement — pas besoin de
        réimporter après un changement de langue.
      </p>

      <div className="dev-locale-grid">
        <label className="field">
          <span className="field__lbl">Catalogue CMS</span>
          <select
            className="dev-search-input"
            disabled={!ready}
            onChange={(e) => setCatalogLocale(e.target.value as "en" | "fr")}
            value={catalogLocale}
          >
            <option value="en">Anglais (IPTC)</option>
            <option value="fr">Français</option>
          </select>
        </label>

        <label className="field">
          <span className="field__lbl">Wikipedia ingestion</span>
          <select
            className="dev-search-input"
            disabled={!ready}
            onChange={(e) => setWikipediaLocale(e.target.value as "en" | "fr")}
            value={wikipediaLocale}
          >
            <option value="en">en.wikipedia.org</option>
            <option value="fr">fr.wikipedia.org</option>
          </select>
        </label>
      </div>

      <div className="stack-actions" style={{ marginTop: 16 }}>
        <button
          className="primary-button"
          disabled={!ready}
          onClick={() => void handleSave()}
          type="button"
        >
          Enregistrer les langues
        </button>
        {saved && <span className="dev-success-copy">✓ Langues enregistrées</span>}
        {errorMsg && <span className="dev-error-copy">{errorMsg}</span>}
      </div>
    </section>
  );
}

function IptcImportPanel({ ready }: { ready: boolean }) {
  const stats = useQuery(
    api.cms.catalog.getCategoryCatalogStats,
    ready ? {} : "skip",
  );
  const importIptc = useAction(api.cms.catalog.importIptcForCms);

  const [importState, setImportState] = useState<ImportState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [importResult, setImportResult] = useState<{
    parsed: number;
    imported: number;
    frenchLabels: number;
  } | null>(null);

  const handleImport = async () => {
    setImportState("importing");
    setErrorMsg("");
    setImportResult(null);
    try {
      const result = await importIptc({});
      setImportResult(result);
      setImportState("success");
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

      {!ready && <p className="empty-copy">Connexion au backend…</p>}

      {ready && stats === undefined && (
        <p className="empty-copy">Chargement des statistiques…</p>
      )}

      {ready && isEmpty && importState === "idle" && (
        <div className="dev-empty-state">
          <p className="empty-copy">
            Le catalogue est vide. Importe les nœuds IPTC (EN + FR) pour
            alimenter le réservoir utilisé dans l&apos;onglet Catégories.
          </p>
        </div>
      )}

      {hasData && importState === "idle" && (
        <p className="empty-copy">
          Catalogue présent · relance l&apos;import pour mettre à jour les
          libellés.
        </p>
      )}

      {importState === "success" && importResult && (
        <p className="dev-success-copy">
          ✓ Import terminé — {importResult.imported} nœuds enregistrés (
          {importResult.frenchLabels} libellés FR).
        </p>
      )}

      {importState === "error" && (
        <p className="dev-error-copy">Erreur : {errorMsg}</p>
      )}

      <div className="stack-actions" style={{ marginTop: 16 }}>
        <button
          className="primary-button"
          disabled={!ready || importState === "importing"}
          onClick={() => void handleImport()}
          type="button"
        >
          {importState === "importing"
            ? "Import en cours…"
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

export function DeveloperTab({ ready }: { ready: boolean }) {
  return (
    <main className="page">
      <div className="page__head">
        <div>
          <p className="page__crumb">⬡ Espace développeur</p>
          <h1 className="page__title">
            <i>Développeur</i>
          </h1>
          <p className="page__sub">
            Import IPTC · Langues discovery · Réservoir global
          </p>
        </div>
      </div>

      <div className="dev-grid">
        <IptcImportPanel ready={ready} />
        <DiscoveryLocalesPanel ready={ready} />
      </div>
    </main>
  );
}

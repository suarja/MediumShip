"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "../../../../convex/_generated/api";

type WhitelistLocale = "fr" | "en";

function WhitelistLocaleList({
  locale,
  ready,
}: {
  locale: WhitelistLocale;
  ready: boolean;
}) {
  const rows = useQuery(
    api.cms.youtubeWhitelist.listWhitelistChannelsForCms,
    ready ? { locale } : "skip",
  );
  const toggleChannel = useMutation(api.cms.youtubeWhitelist.toggleWhitelistChannel);
  const removeChannel = useMutation(api.cms.youtubeWhitelist.removeWhitelistChannel);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggle = async (channelId: string, enabled: boolean) => {
    setPendingId(channelId);
    setErrorMsg(null);
    try {
      await toggleChannel({ channelId, locale, enabled });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (channelId: string) => {
    setPendingId(channelId);
    setErrorMsg(null);
    try {
      await removeChannel({ channelId, locale });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setPendingId(null);
    }
  };

  if (!ready) {
    return <p className="empty-copy">Connexion au backend…</p>;
  }

  if (rows === undefined) {
    return <p className="empty-copy">Chargement…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="empty-copy">
        Aucune chaîne {locale.toUpperCase()} pour l&apos;instant.
      </p>
    );
  }

  return (
    <>
      <ul className="yt-whitelist-list">
        {rows.map((row) => (
          <li className="yt-whitelist-row" key={row._id}>
            <div className="yt-whitelist-row__main">
              <span className="yt-whitelist-row__label">{row.label}</span>
              <span className="yt-whitelist-row__meta">
                {row.defaultCategory} · {row.channelId}
              </span>
            </div>
            <div className="yt-whitelist-row__actions">
              <label className="yt-whitelist-toggle">
                <input
                  checked={row.enabled}
                  disabled={pendingId === row.channelId}
                  onChange={(event) =>
                    void handleToggle(row.channelId, event.currentTarget.checked)
                  }
                  type="checkbox"
                />
                <span>{row.enabled ? "Active" : "Inactive"}</span>
              </label>
              <button
                className="ghost-button yt-whitelist-remove"
                disabled={pendingId === row.channelId}
                onClick={() => void handleRemove(row.channelId)}
                type="button"
              >
                Retirer
              </button>
            </div>
          </li>
        ))}
      </ul>
      {errorMsg ? <p className="dev-error-copy">{errorMsg}</p> : null}
    </>
  );
}

export function YoutubeWhitelistPanel({ ready }: { ready: boolean }) {
  const frRows = useQuery(
    api.cms.youtubeWhitelist.listWhitelistChannelsForCms,
    ready ? { locale: "fr" } : "skip",
  );
  const enRows = useQuery(
    api.cms.youtubeWhitelist.listWhitelistChannelsForCms,
    ready ? { locale: "en" } : "skip",
  );
  const seedWhitelist = useMutation(api.cms.youtubeWhitelist.seedYoutubeWhitelistForCms);
  const addChannel = useAction(api.cms.youtubeWhitelist.addWhitelistChannel);

  const [input, setInput] = useState("");
  const [locale, setLocale] = useState<WhitelistLocale>("fr");
  const [defaultCategory, setDefaultCategory] = useState("science");
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEmpty =
    ready &&
    frRows !== undefined &&
    enRows !== undefined &&
    frRows.length === 0 &&
    enRows.length === 0;

  const handleSeed = async () => {
    setSeeding(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await seedWhitelist({});
      setSuccessMsg(
        `Import terminé — ${result.inserted} ajoutée(s), ${result.skipped} déjà présente(s).`,
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSeeding(false);
    }
  };

  const handleAdd = async () => {
    setAdding(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const added = await addChannel({
        url: input.trim(),
        locale,
        defaultCategory: defaultCategory.trim(),
      });
      setInput("");
      setSuccessMsg(`Chaîne ajoutée : ${added.label}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="panel dev-panel yt-whitelist-panel">
      <div className="panel-header">
        <div>
          <p className="page__crumb">Vidéos discovery</p>
          <h2 className="panel-title">Whitelist YouTube</h2>
        </div>
        {ready && frRows !== undefined && enRows !== undefined ? (
          <div className="catalog-stats">
            <span className="stat-chip">
              <strong>{frRows.filter((row) => row.enabled).length}</strong> FR
            </span>
            <span className="stat-chip stat-chip--muted">
              <strong>{enRows.filter((row) => row.enabled).length}</strong> EN
            </span>
          </div>
        ) : null}
      </div>

      <p className="empty-copy">
        Chaînes éditoriales ingérées pour le feed Découvrir. Les entrées
        désactivées sont ignorées au prochain run d&apos;ingestion.
      </p>

      {isEmpty ? (
        <div className="dev-empty-state">
          <p className="empty-copy">
            La liste est vide. Importe les chaînes FR/EN du seed initial ou
            ajoute une chaîne manuellement.
          </p>
          <button
            className="primary-button"
            disabled={!ready || seeding}
            onClick={() => void handleSeed()}
            type="button"
          >
            {seeding ? "Import en cours…" : "Importer le seed initial"}
          </button>
        </div>
      ) : null}

      <div className="yt-whitelist-add">
        <label className="field">
          <span className="field__lbl">Ajouter une chaîne</span>
          <input
            className="dev-search-input"
            disabled={!ready || adding}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder="URL YouTube ou @handle"
            type="text"
            value={input}
          />
        </label>

        <label className="field">
          <span className="field__lbl">Locale</span>
          <select
            className="dev-search-input"
            disabled={!ready || adding}
            onChange={(event) => setLocale(event.currentTarget.value as WhitelistLocale)}
            value={locale}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </label>

        <label className="field">
          <span className="field__lbl">Catégorie par défaut</span>
          <input
            className="dev-search-input"
            disabled={!ready || adding}
            onChange={(event) => setDefaultCategory(event.currentTarget.value)}
            placeholder="science, tech, histoire…"
            type="text"
            value={defaultCategory}
          />
        </label>

        <button
          className="primary-button"
          disabled={!ready || adding || input.trim().length === 0}
          onClick={() => void handleAdd()}
          type="button"
        >
          {adding ? "Ajout…" : "Ajouter"}
        </button>
      </div>

      {successMsg ? <p className="dev-success-copy">✓ {successMsg}</p> : null}
      {errorMsg ? <p className="dev-error-copy">{errorMsg}</p> : null}

      <div className="yt-whitelist-columns">
        <div>
          <h3 className="yt-whitelist-locale-title">Français</h3>
          <WhitelistLocaleList locale="fr" ready={ready} />
        </div>
        <div>
          <h3 className="yt-whitelist-locale-title">English</h3>
          <WhitelistLocaleList locale="en" ready={ready} />
        </div>
      </div>
    </section>
  );
}

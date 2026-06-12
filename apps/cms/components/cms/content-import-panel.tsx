"use client";

import { useAction } from "convex/react";
import { useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { useToast } from "./toast";

type ImportResult =
  | { imported: false; reason: string }
  | { imported: true; contentId: string; title: string };

/** A single URL → import row (Wikipedia / web article). */
function UrlImporter({
  ready,
  label,
  placeholder,
  cta,
  action,
}: {
  ready: boolean;
  label: string;
  placeholder: string;
  cta: string;
  action: (url: string) => Promise<ImportResult>;
}) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const trimmed = url.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await action(trimmed);
      if (result.imported) {
        setUrl("");
        toast(`Brouillon créé : ${result.title}`, "success");
      } else {
        toast(`Échec : ${result.reason}`, "error");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Échec de l'import", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dev-import-row">
      <label className="field">
        <span className="field__lbl">{label}</span>
        <input
          className="dev-search-input"
          disabled={!ready}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void run();
            }
          }}
          placeholder={placeholder}
          type="url"
          value={url}
        />
      </label>
      <button
        className="primary-button"
        disabled={!ready || busy || !url.trim()}
        onClick={() => void run()}
        type="button"
      >
        {busy ? "Import…" : cta}
      </button>
    </div>
  );
}

function PodcastImporter({ ready }: { ready: boolean }) {
  const { toast } = useToast();
  const fetchPodcastFeed = useAction(api.podcasts.import.fetchPodcastFeed);
  const importPodcastEpisode = useAction(api.podcasts.import.importPodcastEpisode);
  const [feedUrl, setFeedUrl] = useState("");
  const [episodes, setEpisodes] = useState<{ guid: string; title: string }[]>([]);
  const [selectedGuid, setSelectedGuid] = useState("");
  const [busy, setBusy] = useState(false);

  const onFetch = async () => {
    const url = feedUrl.trim();
    if (!url || busy) {
      return;
    }
    setBusy(true);
    setEpisodes([]);
    setSelectedGuid("");
    try {
      const result = await fetchPodcastFeed({ feedUrl: url });
      if (result.ok && result.episodes.length > 0) {
        const list = result.episodes.map((episode) => ({
          guid: episode.guid,
          title: episode.title,
        }));
        setEpisodes(list);
        setSelectedGuid(list[0].guid);
        toast(`${list.length} épisode(s) trouvé(s)`, "info");
      } else {
        toast(
          result.ok ? "Aucun épisode audio trouvé." : `Échec : ${result.reason}`,
          "error",
        );
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Échec du chargement", "error");
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    const url = feedUrl.trim();
    if (!url || !selectedGuid || busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await importPodcastEpisode({ feedUrl: url, guid: selectedGuid });
      if (result.imported) {
        toast(`Brouillon créé : ${result.title}`, "success");
      } else {
        toast(`Échec : ${result.reason}`, "error");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Échec de l'import", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dev-import-row">
      <label className="field">
        <span className="field__lbl">Flux RSS de podcast</span>
        <input
          className="dev-search-input"
          disabled={!ready}
          onChange={(event) => setFeedUrl(event.target.value)}
          placeholder="https://exemple.com/podcast.rss"
          type="url"
          value={feedUrl}
        />
      </label>
      {episodes.length > 0 && (
        <label className="field">
          <span className="field__lbl">Épisode</span>
          <select
            className="dev-search-input"
            onChange={(event) => setSelectedGuid(event.target.value)}
            value={selectedGuid}
          >
            {episodes.map((episode) => (
              <option key={episode.guid} value={episode.guid}>
                {episode.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="stack-actions">
        <button
          className="ghost-button"
          disabled={!ready || busy || !feedUrl.trim()}
          onClick={() => void onFetch()}
          type="button"
        >
          {busy ? "Chargement…" : "Charger les épisodes"}
        </button>
        {episodes.length > 0 && (
          <button
            className="primary-button"
            disabled={busy || !selectedGuid}
            onClick={() => void onImport()}
            type="button"
          >
            Importer l&apos;épisode
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Developer-tab panel to import external content (Wikipedia, any web article,
 * podcast episodes) as drafts. Each import creates a draft you review/publish in
 * the Contents tab, then add to a collection (e.g. "pourquoi-ce-fil").
 */
export function ContentImportPanel({ ready }: { ready: boolean }) {
  const importWikipedia = useAction(api.wikipedia.import.importWikipediaArticle);
  const importArticle = useAction(api.articles.import.importArticleFromUrl);

  return (
    <section className="panel dev-panel">
      <div className="panel-header">
        <div>
          <p className="page__crumb">Import de contenu</p>
          <h2 className="panel-title">Sources externes</h2>
        </div>
      </div>

      <p className="empty-copy">
        Chaque import crée un <strong>brouillon</strong> à relire et publier dans
        l&apos;onglet Contenus, puis à ajouter à une collection (ex.&nbsp;
        <code>pourquoi-ce-fil</code> pour l&apos;onboarding).
      </p>

      <UrlImporter
        action={(url) => importWikipedia({ url })}
        cta="Importer Wikipédia"
        label="Article Wikipédia (URL, toute langue)"
        placeholder="https://fr.wikipedia.org/wiki/Homophilie"
        ready={ready}
      />
      <UrlImporter
        action={(url) => importArticle({ url })}
        cta="Importer l'article web"
        label="Article web (n'importe quelle URL)"
        placeholder="https://exemple.com/un-article"
        ready={ready}
      />
      <PodcastImporter ready={ready} />
    </section>
  );
}

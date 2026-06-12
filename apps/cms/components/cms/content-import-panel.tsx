"use client";

import { useAction } from "convex/react";
import { useState } from "react";

import { api } from "../../../../convex/_generated/api";

/**
 * Developer-tab panel to import external content (Wikipedia, any web article,
 * podcast episodes) as drafts. Each import creates a draft you then review and
 * publish in the Contents tab, and add to a collection (e.g. "pourquoi-ce-fil").
 */
export function ContentImportPanel({ ready }: { ready: boolean }) {
  const importWikipedia = useAction(api.wikipedia.import.importWikipediaArticle);
  const importArticle = useAction(api.articles.import.importArticleFromUrl);
  const fetchPodcastFeed = useAction(api.podcasts.import.fetchPodcastFeed);
  const importPodcastEpisode = useAction(api.podcasts.import.importPodcastEpisode);

  const [wikiUrl, setWikiUrl] = useState("");
  const [wikiBusy, setWikiBusy] = useState(false);
  const [wikiMessage, setWikiMessage] = useState<string | null>(null);
  const [wikiError, setWikiError] = useState(false);

  const [articleUrl, setArticleUrl] = useState("");
  const [articleBusy, setArticleBusy] = useState(false);
  const [articleMessage, setArticleMessage] = useState<string | null>(null);
  const [articleError, setArticleError] = useState(false);

  const [feedUrl, setFeedUrl] = useState("");
  const [episodes, setEpisodes] = useState<{ guid: string; title: string }[]>([]);
  const [selectedGuid, setSelectedGuid] = useState("");
  const [podcastBusy, setPodcastBusy] = useState(false);
  const [podcastMessage, setPodcastMessage] = useState<string | null>(null);
  const [podcastError, setPodcastError] = useState(false);

  const runImport = async (
    url: string,
    busy: boolean,
    setBusy: (value: boolean) => void,
    setMessage: (value: string | null) => void,
    setError: (value: boolean) => void,
    action: (url: string) => Promise<
      | { imported: false; reason: string }
      | { imported: true; contentId: string; title: string }
    >,
    clearUrl: () => void,
  ) => {
    const trimmed = url.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(false);
    try {
      const result = await action(trimmed);
      if (result.imported) {
        clearUrl();
        setMessage(`Brouillon créé : ${result.title}`);
      } else {
        setError(true);
        setMessage(`Échec : ${result.reason}`);
      }
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "Échec de l'import");
    } finally {
      setBusy(false);
    }
  };

  const onFetchPodcast = async () => {
    const url = feedUrl.trim();
    if (!url || podcastBusy) {
      return;
    }
    setPodcastBusy(true);
    setPodcastMessage(null);
    setPodcastError(false);
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
        setPodcastMessage(`${list.length} épisode(s) trouvé(s)`);
      } else {
        setPodcastError(true);
        setPodcastMessage(
          result.ok ? "Aucun épisode audio trouvé." : `Échec : ${result.reason}`,
        );
      }
    } catch (err) {
      setPodcastError(true);
      setPodcastMessage(err instanceof Error ? err.message : "Échec du chargement");
    } finally {
      setPodcastBusy(false);
    }
  };

  const onImportPodcast = async () => {
    const url = feedUrl.trim();
    if (!url || !selectedGuid || podcastBusy) {
      return;
    }
    setPodcastBusy(true);
    setPodcastMessage(null);
    setPodcastError(false);
    try {
      const result = await importPodcastEpisode({ feedUrl: url, guid: selectedGuid });
      if (result.imported) {
        setPodcastMessage(`Brouillon créé : ${result.title}`);
      } else {
        setPodcastError(true);
        setPodcastMessage(`Échec : ${result.reason}`);
      }
    } catch (err) {
      setPodcastError(true);
      setPodcastMessage(err instanceof Error ? err.message : "Échec de l'import");
    } finally {
      setPodcastBusy(false);
    }
  };

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

      {/* Wikipedia */}
      <label className="field">
        <span className="field__lbl">Article Wikipédia (URL, toute langue)</span>
        <input
          className="dev-search-input"
          disabled={!ready}
          onChange={(event) => setWikiUrl(event.target.value)}
          placeholder="https://fr.wikipedia.org/wiki/Homophilie"
          type="url"
          value={wikiUrl}
        />
      </label>
      <div className="stack-actions" style={{ marginTop: 8 }}>
        <button
          className="primary-button"
          disabled={!ready || wikiBusy || !wikiUrl.trim()}
          onClick={() =>
            void runImport(
              wikiUrl,
              wikiBusy,
              setWikiBusy,
              setWikiMessage,
              setWikiError,
              (url) => importWikipedia({ url }),
              () => setWikiUrl(""),
            )
          }
          type="button"
        >
          {wikiBusy ? "Import…" : "Importer Wikipédia"}
        </button>
        {wikiMessage && (
          <span className={wikiError ? "dev-error-copy" : "dev-success-copy"}>
            {wikiMessage}
          </span>
        )}
      </div>

      {/* Generic web article */}
      <label className="field" style={{ marginTop: 16 }}>
        <span className="field__lbl">Article web (n&apos;importe quelle URL)</span>
        <input
          className="dev-search-input"
          disabled={!ready}
          onChange={(event) => setArticleUrl(event.target.value)}
          placeholder="https://exemple.com/un-article"
          type="url"
          value={articleUrl}
        />
      </label>
      <div className="stack-actions" style={{ marginTop: 8 }}>
        <button
          className="primary-button"
          disabled={!ready || articleBusy || !articleUrl.trim()}
          onClick={() =>
            void runImport(
              articleUrl,
              articleBusy,
              setArticleBusy,
              setArticleMessage,
              setArticleError,
              (url) => importArticle({ url }),
              () => setArticleUrl(""),
            )
          }
          type="button"
        >
          {articleBusy ? "Import…" : "Importer l'article web"}
        </button>
        {articleMessage && (
          <span className={articleError ? "dev-error-copy" : "dev-success-copy"}>
            {articleMessage}
          </span>
        )}
      </div>

      {/* Podcast RSS */}
      <label className="field" style={{ marginTop: 16 }}>
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
        <label className="field" style={{ marginTop: 8 }}>
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
      <div className="stack-actions" style={{ marginTop: 8 }}>
        <button
          className="ghost-button"
          disabled={!ready || podcastBusy || !feedUrl.trim()}
          onClick={() => void onFetchPodcast()}
          type="button"
        >
          {podcastBusy ? "Chargement…" : "Charger les épisodes"}
        </button>
        {episodes.length > 0 && (
          <button
            className="primary-button"
            disabled={podcastBusy || !selectedGuid}
            onClick={() => void onImportPodcast()}
            type="button"
          >
            Importer l&apos;épisode
          </button>
        )}
        {podcastMessage && (
          <span className={podcastError ? "dev-error-copy" : "dev-success-copy"}>
            {podcastMessage}
          </span>
        )}
      </div>
    </section>
  );
}

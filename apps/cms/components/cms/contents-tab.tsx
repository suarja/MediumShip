"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  EditorialList,
  type EditorialStatusFilter,
} from "./editorial-list";
import { ContentForm } from "./content-form";

type ContentsTabProps = {
  items: Doc<"contents">[];
  onCreate: (kind: "article" | "episode" | "video") => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
};

function matchesQuery(item: Doc<"contents">, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [
    item.title,
    item.slug,
    item.summary,
    item.category,
    item.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

export function ContentsTab({
  items,
  onCreate,
  onSelect,
  selectedId,
}: ContentsTabProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<EditorialStatusFilter>("all");

  const importWikipedia = useAction(api.wikipedia.import.importWikipediaArticle);
  const [wikiUrl, setWikiUrl] = useState("");
  const [wikiBusy, setWikiBusy] = useState(false);
  const [wikiMessage, setWikiMessage] = useState<string | null>(null);

  const onImportWikipedia = async () => {
    const url = wikiUrl.trim();
    if (!url || wikiBusy) {
      return;
    }
    setWikiBusy(true);
    setWikiMessage(null);
    try {
      const result = await importWikipedia({ url });
      if (result.imported) {
        setWikiUrl("");
        setWikiMessage(`Imported draft: ${result.title}`);
        onSelect(result.contentId);
      } else {
        setWikiMessage(`Import failed: ${result.reason}`);
      }
    } catch (error) {
      setWikiMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setWikiBusy(false);
    }
  };

  const fetchPodcastFeed = useAction(api.podcasts.import.fetchPodcastFeed);
  const importPodcastEpisode = useAction(api.podcasts.import.importPodcastEpisode);
  const [feedUrl, setFeedUrl] = useState("");
  const [episodes, setEpisodes] = useState<
    { guid: string; title: string }[]
  >([]);
  const [selectedGuid, setSelectedGuid] = useState("");
  const [podcastBusy, setPodcastBusy] = useState(false);
  const [podcastMessage, setPodcastMessage] = useState<string | null>(null);

  const onFetchPodcast = async () => {
    const url = feedUrl.trim();
    if (!url || podcastBusy) {
      return;
    }
    setPodcastBusy(true);
    setPodcastMessage(null);
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
      } else {
        setPodcastMessage(
          result.ok ? "No audio episodes found." : `Fetch failed: ${result.reason}`,
        );
      }
    } catch (error) {
      setPodcastMessage(error instanceof Error ? error.message : "Fetch failed");
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
    try {
      const result = await importPodcastEpisode({ feedUrl: url, guid: selectedGuid });
      if (result.imported) {
        setPodcastMessage(`Imported draft: ${result.title}`);
        onSelect(result.contentId);
      } else {
        setPodcastMessage(`Import failed: ${result.reason}`);
      }
    } catch (error) {
      setPodcastMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setPodcastBusy(false);
    }
  };

  const counts = useMemo<Record<EditorialStatusFilter, number>>(
    () =>
      items.reduce(
        (acc, item) => {
          acc.all += 1;
          acc[item.status] += 1;
          return acc;
        },
        { all: 0, published: 0, draft: 0, archived: 0 },
      ),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (
          statusFilter !== "all" &&
          item.status !== statusFilter
        ) {
          return false;
        }

        return matchesQuery(item, query);
      }),
    [items, query, statusFilter],
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
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <input
          type="url"
          value={wikiUrl}
          onChange={(event) => setWikiUrl(event.target.value)}
          placeholder="Import a Wikipedia article URL (any language)…"
          style={{ flex: "1 1 320px", minWidth: 240, padding: "8px 10px" }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void onImportWikipedia();
            }
          }}
        />
        <button
          type="button"
          disabled={wikiBusy || !wikiUrl.trim()}
          onClick={() => void onImportWikipedia()}
          style={{ padding: "8px 14px" }}
        >
          {wikiBusy ? "Importing…" : "Import from Wikipedia"}
        </button>
        {wikiMessage ? (
          <span style={{ fontSize: 13, opacity: 0.8 }}>{wikiMessage}</span>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <input
          type="url"
          value={feedUrl}
          onChange={(event) => setFeedUrl(event.target.value)}
          placeholder="Import a podcast RSS feed URL…"
          style={{ flex: "1 1 320px", minWidth: 240, padding: "8px 10px" }}
        />
        <button
          type="button"
          disabled={podcastBusy || !feedUrl.trim()}
          onClick={() => void onFetchPodcast()}
          style={{ padding: "8px 14px" }}
        >
          {podcastBusy ? "Working…" : "Fetch episodes"}
        </button>
        {episodes.length > 0 ? (
          <>
            <select
              value={selectedGuid}
              onChange={(event) => setSelectedGuid(event.target.value)}
              style={{ flex: "1 1 240px", minWidth: 200, padding: "8px 10px" }}
            >
              {episodes.map((episode) => (
                <option key={episode.guid} value={episode.guid}>
                  {episode.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={podcastBusy || !selectedGuid}
              onClick={() => void onImportPodcast()}
              style={{ padding: "8px 14px" }}
            >
              Import episode
            </button>
          </>
        ) : null}
        {podcastMessage ? (
          <span style={{ fontSize: 13, opacity: 0.8 }}>{podcastMessage}</span>
        ) : null}
      </div>

      <div className="contents-grid">
        <EditorialList
          counts={counts}
          items={filteredItems}
          onCreate={onCreate}
          onQueryChange={setQuery}
          onSelect={onSelect}
          onStatusFilterChange={setStatusFilter}
          query={query}
          selectedId={selectedId}
          statusFilter={statusFilter}
        />

        <ContentForm key={selectedId ?? "none"} selectedId={selectedId} />
      </div>
    </main>
  );
}

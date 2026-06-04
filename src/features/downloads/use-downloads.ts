import { useCallback, useEffect, useState } from "react";

import type { ContentDoc } from "../content/types";
import {
  downloadContent,
  getDownloadedContent,
  listDownloadedContent,
  type DownloadedContentRecord,
} from "./storage";

type UseDownloadsArgs = {
  contentId?: string;
  enabled?: boolean;
};

export function useDownloads({ contentId, enabled = true }: UseDownloadsArgs = {}) {
  const [downloads, setDownloads] = useState<DownloadedContentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [downloadingContentId, setDownloadingContentId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setDownloads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const nextDownloads = contentId
      ? await getDownloadedContent(contentId).then((item) => (item ? [item] : []))
      : await listDownloadedContent();
    setDownloads(nextDownloads);
    setIsLoading(false);
  }, [contentId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startDownload = useCallback(
    async (content: ContentDoc) => {
      setDownloadingContentId(content._id);
      try {
        const record = await downloadContent(content);
        setDownloads((current) => {
          const next = current.filter((item) => item.content._id !== content._id);
          return [record, ...next].sort(
            (left, right) => right.downloadedAt - left.downloadedAt,
          );
        });
        return record;
      } finally {
        setDownloadingContentId(null);
      }
    },
    [],
  );

  const downloadedItem =
    contentId === undefined
      ? null
      : downloads.find((item) => item.content._id === contentId) ?? null;

  return {
    downloads,
    downloadedItem,
    isLoading,
    isDownloading: contentId !== undefined && downloadingContentId === contentId,
    downloadContent: startDownload,
    refresh,
  };
}

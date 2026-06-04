import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import { getContentCoverImageUrl } from "../content/selectors";
import type { ContentDoc } from "../content/types";
import { getDownloadSupport } from "./model";

const STORAGE_KEY = "mediumship:downloads:v1";
const DOWNLOADS_DIR_NAME = "mediumship-downloads";

export type DownloadedContentRecord = {
  content: ContentDoc;
  downloadedAt: number;
  localCoverImagePath?: string;
  localMediaPath?: string;
};

function requireDocumentDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error("Download storage unavailable");
  }

  return `${FileSystem.documentDirectory}${DOWNLOADS_DIR_NAME}/`;
}

function getFileExtension(url: string, fallback: string): string {
  try {
    const pathname = new URL(url).pathname;
    const candidate = pathname.split(".").pop()?.trim().toLowerCase();
    if (candidate && candidate.length <= 5) {
      return candidate;
    }
  } catch {
    // Ignore malformed URLs and fall back to the provided extension.
  }

  return fallback;
}

async function ensureDirectory(uri: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
}

async function readDownloadIndex(): Promise<Record<string, DownloadedContentRecord>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, DownloadedContentRecord>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

async function writeDownloadIndex(
  nextIndex: Record<string, DownloadedContentRecord>,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextIndex));
}

async function downloadOptionalCover(
  content: ContentDoc,
  directoryUri: string,
): Promise<string | undefined> {
  const coverImageUrl = getContentCoverImageUrl(content);
  if (!coverImageUrl) {
    return undefined;
  }

  const coverUri = `${directoryUri}cover.${getFileExtension(coverImageUrl, "jpg")}`;
  const result = await FileSystem.downloadAsync(coverImageUrl, coverUri);
  return result.uri;
}

export async function listDownloadedContent(): Promise<DownloadedContentRecord[]> {
  const index = await readDownloadIndex();
  return Object.values(index).sort((left, right) => right.downloadedAt - left.downloadedAt);
}

export async function getDownloadedContent(
  contentId: string,
): Promise<DownloadedContentRecord | null> {
  const index = await readDownloadIndex();
  return index[contentId] ?? null;
}

export async function downloadContent(
  content: ContentDoc,
): Promise<DownloadedContentRecord> {
  const rootDirectory = requireDocumentDirectory();
  const contentDirectory = `${rootDirectory}${content._id}/`;
  const support = getDownloadSupport(content);

  if (support.kind === "unsupported") {
    throw new Error(
      support.reason === "youtube"
        ? "YouTube downloads are not supported"
        : "This content does not have a downloadable source",
    );
  }

  await ensureDirectory(contentDirectory);

  const localCoverImagePath = await downloadOptionalCover(content, contentDirectory);
  let localMediaPath: string | undefined;

  if (support.kind === "episode") {
    const targetUri = `${contentDirectory}audio.${getFileExtension(
      support.sourceUrl,
      "mp3",
    )}`;
    const result = await FileSystem.downloadAsync(support.sourceUrl, targetUri);
    localMediaPath = result.uri;
  }

  if (support.kind === "hostedVideo") {
    const targetUri = `${contentDirectory}video.${getFileExtension(
      support.sourceUrl,
      "mp4",
    )}`;
    const result = await FileSystem.downloadAsync(support.sourceUrl, targetUri);
    localMediaPath = result.uri;
  }

  const record: DownloadedContentRecord = {
    content,
    downloadedAt: Date.now(),
    localCoverImagePath,
    localMediaPath,
  };
  const index = await readDownloadIndex();

  index[content._id] = record;
  await writeDownloadIndex(index);

  return record;
}

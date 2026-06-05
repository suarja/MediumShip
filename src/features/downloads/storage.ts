import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import { getContentCoverImageUrl } from "../content/selectors";
import type { ContentDoc } from "../content/types";
import { getDownloadSupport } from "./model";

// v2: records now store RELATIVE paths. The iOS app-container UUID changes on
// every reinstall/rebuild, so absolute file:// paths (the v1 shape) became
// stale and AVFoundation failed to load them ("operation could not be
// completed"). We persist paths relative to the downloads dir and rebuild the
// absolute path from the current documentDirectory at read time.
const STORAGE_KEY = "mediumship:downloads:v2";
const DOWNLOADS_DIR_NAME = "mediumship-downloads";

// Public shape (unchanged for consumers): absolute, ready-to-play file:// URIs.
export type DownloadedContentRecord = {
  content: ContentDoc;
  downloadedAt: number;
  localCoverImagePath?: string;
  localMediaPath?: string;
};

// Persisted shape: relative paths, container-independent.
type StoredDownloadRecord = {
  content: ContentDoc;
  downloadedAt: number;
  coverRelPath?: string;
  mediaRelPath?: string;
};

function downloadsDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error("Download storage unavailable");
  }

  return `${FileSystem.documentDirectory}${DOWNLOADS_DIR_NAME}/`;
}

function toAbsolute(relativePath: string): string {
  return `${downloadsDirectory()}${relativePath}`;
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

async function fileExists(relativePath: string | undefined): Promise<boolean> {
  if (!relativePath) {
    return false;
  }

  try {
    const info = await FileSystem.getInfoAsync(toAbsolute(relativePath));
    return info.exists && (info.size ?? 0) > 0;
  } catch {
    return false;
  }
}

// Downloads a remote file, FAILING (and cleaning up) on a non-200 response.
// expo-file-system writes whatever the server returns — including an R2/HTTP
// error body — so without this an AccessDenied/404 would be saved as a bogus
// "video.mp4" that AVFoundation then refuses to play.
async function downloadToFile(sourceUrl: string, targetUri: string): Promise<void> {
  const result = await FileSystem.downloadAsync(sourceUrl, targetUri);
  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(targetUri, { idempotent: true });
    throw new Error(`Download failed (HTTP ${result.status})`);
  }
}

async function readStoredIndex(): Promise<Record<string, StoredDownloadRecord>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, StoredDownloadRecord>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

async function writeStoredIndex(
  nextIndex: Record<string, StoredDownloadRecord>,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextIndex));
}

// Resolves a stored (relative) record to absolute paths, verifying the media
// file still exists. Returns null for a record whose file is gone (e.g. after a
// reinstall) so callers treat it as "not downloaded" and can offer re-download.
async function resolveRecord(
  stored: StoredDownloadRecord,
): Promise<DownloadedContentRecord | null> {
  const hasMedia = await fileExists(stored.mediaRelPath);
  if (stored.mediaRelPath && !hasMedia) {
    return null;
  }

  const hasCover = await fileExists(stored.coverRelPath);

  return {
    content: stored.content,
    downloadedAt: stored.downloadedAt,
    localMediaPath: stored.mediaRelPath ? toAbsolute(stored.mediaRelPath) : undefined,
    localCoverImagePath:
      stored.coverRelPath && hasCover ? toAbsolute(stored.coverRelPath) : undefined,
  };
}

async function downloadOptionalCover(
  content: ContentDoc,
  contentId: string,
): Promise<string | undefined> {
  const coverImageUrl = getContentCoverImageUrl(content);
  if (!coverImageUrl) {
    return undefined;
  }

  const relPath = `${contentId}/cover.${getFileExtension(coverImageUrl, "jpg")}`;
  try {
    await downloadToFile(coverImageUrl, toAbsolute(relPath));
    return relPath;
  } catch {
    // Cover is optional — a failed cover must not fail the whole download.
    return undefined;
  }
}

export async function listDownloadedContent(): Promise<DownloadedContentRecord[]> {
  const index = await readStoredIndex();
  const resolved = await Promise.all(
    Object.values(index).map((record) => resolveRecord(record)),
  );

  // Prune entries whose files have gone missing so the UI reflects reality.
  const missingIds = Object.values(index)
    .filter((record, i) => resolved[i] === null)
    .map((record) => record.content._id);
  if (missingIds.length > 0) {
    for (const id of missingIds) {
      delete index[id];
    }
    await writeStoredIndex(index);
  }

  return resolved
    .filter((record): record is DownloadedContentRecord => record !== null)
    .sort((left, right) => right.downloadedAt - left.downloadedAt);
}

export async function getDownloadedContent(
  contentId: string,
): Promise<DownloadedContentRecord | null> {
  const index = await readStoredIndex();
  const stored = index[contentId];
  if (!stored) {
    return null;
  }

  const resolved = await resolveRecord(stored);
  if (!resolved) {
    // File is gone (reinstall/cleanup) — drop the stale entry.
    delete index[contentId];
    await writeStoredIndex(index);
  }

  return resolved;
}

export async function downloadContent(
  content: ContentDoc,
): Promise<DownloadedContentRecord> {
  const contentDirectory = `${downloadsDirectory()}${content._id}/`;
  const support = getDownloadSupport(content);

  if (support.kind === "unsupported") {
    throw new Error(
      support.reason === "youtube"
        ? "YouTube downloads are not supported"
        : "This content does not have a downloadable source",
    );
  }

  await ensureDirectory(contentDirectory);

  const coverRelPath = await downloadOptionalCover(content, content._id);
  let mediaRelPath: string | undefined;

  if (support.kind === "episode") {
    mediaRelPath = `${content._id}/audio.${getFileExtension(support.sourceUrl, "mp3")}`;
    await downloadToFile(support.sourceUrl, toAbsolute(mediaRelPath));
  }

  if (support.kind === "hostedVideo") {
    mediaRelPath = `${content._id}/video.${getFileExtension(support.sourceUrl, "mp4")}`;
    await downloadToFile(support.sourceUrl, toAbsolute(mediaRelPath));
  }

  const stored: StoredDownloadRecord = {
    content,
    downloadedAt: Date.now(),
    coverRelPath,
    mediaRelPath,
  };
  const index = await readStoredIndex();
  index[content._id] = stored;
  await writeStoredIndex(index);

  return {
    content,
    downloadedAt: stored.downloadedAt,
    localMediaPath: mediaRelPath ? toAbsolute(mediaRelPath) : undefined,
    localCoverImagePath: coverRelPath ? toAbsolute(coverRelPath) : undefined,
  };
}

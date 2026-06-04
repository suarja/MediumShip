// Pure URL sanity checks for the content editor. These do not block saving;
// they surface a confirmation prompt so an editor can catch mistakes such as
// pasting an image URL into the audio field (which makes playback fail
// silently on the client).

export type ContentUrlInput = {
  kind: "article" | "episode" | "video";
  audioUrl: string;
  heroImageUrl: string;
  videoSourceKind: "" | "youtube" | "hosted";
  youtubeUrl: string;
  playbackUrl: string;
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp"];
const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".aac", ".wav", ".ogg", ".oga", ".flac"];
const VIDEO_EXTENSIONS = [".mp4", ".m3u8", ".mov", ".webm", ".mkv", ".m4v"];
const IMAGE_HOST_HINTS = ["images.unsplash.com", "unsplash.com/photos", "imgur.com", "cloudinary.com/image"];

function parseUrl(value: string): URL | null {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

function pathEndsWith(url: URL, extensions: string[]): boolean {
  const path = url.pathname.toLowerCase();
  return extensions.some((extension) => path.endsWith(extension));
}

function looksLikeImage(value: string): boolean {
  const url = parseUrl(value);
  if (!url) {
    return false;
  }
  const haystack = `${url.hostname}${url.pathname}`.toLowerCase();
  return (
    pathEndsWith(url, IMAGE_EXTENSIONS) ||
    IMAGE_HOST_HINTS.some((hint) => haystack.includes(hint))
  );
}

function looksLikeAudio(value: string): boolean {
  const url = parseUrl(value);
  return url ? pathEndsWith(url, AUDIO_EXTENSIONS) : false;
}

function looksLikeVideoFile(value: string): boolean {
  const url = parseUrl(value);
  return url ? pathEndsWith(url, VIDEO_EXTENSIONS) : false;
}

function isHttpUrl(value: string): boolean {
  const url = parseUrl(value);
  return url ? url.protocol === "http:" || url.protocol === "https:" : false;
}

function isYouTubeUrl(value: string): boolean {
  const url = parseUrl(value);
  if (!url) {
    return false;
  }
  const host = url.hostname.replace(/^www\./, "");
  return host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com");
}

export function collectContentUrlWarnings(input: ContentUrlInput): string[] {
  const warnings: string[] = [];

  if (input.kind === "episode") {
    const audioUrl = input.audioUrl.trim();
    if (!audioUrl) {
      warnings.push("L'URL audio est vide — l'épisode n'aura aucune lecture.");
    } else if (!isHttpUrl(audioUrl)) {
      warnings.push("L'URL audio n'est pas une URL http(s) valide.");
    } else if (looksLikeImage(audioUrl)) {
      warnings.push("L'URL audio ressemble à une image, pas à un fichier audio.");
    }
  }

  if (input.kind === "video") {
    if (!input.videoSourceKind) {
      warnings.push("Aucune source vidéo n'est sélectionnée.");
    } else if (input.videoSourceKind === "youtube") {
      const youtubeUrl = input.youtubeUrl.trim();
      if (!youtubeUrl) {
        warnings.push("L'URL YouTube est vide.");
      } else if (!isYouTubeUrl(youtubeUrl)) {
        warnings.push("L'URL ne ressemble pas à un lien YouTube.");
      }
    } else {
      const playbackUrl = input.playbackUrl.trim();
      if (!playbackUrl) {
        warnings.push("L'URL de lecture vidéo est vide.");
      } else if (!isHttpUrl(playbackUrl)) {
        warnings.push("L'URL de lecture vidéo n'est pas une URL http(s) valide.");
      } else if (looksLikeImage(playbackUrl)) {
        warnings.push("L'URL de lecture vidéo ressemble à une image, pas à une vidéo.");
      }
    }
  }

  const heroImageUrl = input.heroImageUrl.trim();
  if (heroImageUrl) {
    if (!isHttpUrl(heroImageUrl)) {
      warnings.push("L'URL de l'image n'est pas une URL http(s) valide.");
    } else if (looksLikeAudio(heroImageUrl) || looksLikeVideoFile(heroImageUrl)) {
      warnings.push("L'URL de l'image ressemble à un fichier audio/vidéo, pas à une image.");
    }
  }

  return warnings;
}

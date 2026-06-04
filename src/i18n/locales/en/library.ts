export default {
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  bookmark: {
    saveCta: "Save for later",
    savedCta: "Saved",
  },
  actions: {
    loading: "Checking your member actions...",
    signInCta: "Sign in to save or download",
    signInHint: "Create an account to save items, sync progress, and download supported content.",
    memberCta: "Members can save and download",
    memberHint: "Bookmarks, synced progress, and offline downloads are reserved for members.",
  },
  download: {
    downloadCta: "Download offline",
    downloadingCta: "Downloading…",
    downloadedCta: "Downloaded",
    downloadedHint: "This copy is stored on the device for offline reading or playback.",
    memberHint: "Articles, episodes, and hosted videos can be downloaded for offline access.",
    youtubeCta: "YouTube only",
    youtubeHint: "YouTube videos stay stream-only and cannot be downloaded.",
    unavailableCta: "Unavailable",
  },
  saved: {
    sectionTitle: "Saved",
    loading: "Loading your saved items...",
    guestHint: "Sign in to start building your saved list.",
    memberHint: "Saved items are available with member access.",
    empty: "Nothing saved yet. Use the save button on any article, episode, or hosted video.",
    rowDescription: "{{kind}} · {{category}}",
  },
  downloads: {
    sectionTitle: "Downloads",
    loading: "Loading your downloads...",
    guestHint: "Sign in to unlock offline downloads on supported content.",
    memberHint: "Offline downloads are available with member access.",
    empty: "No downloads yet. Download an article, episode, or hosted video to keep it on this device.",
    rowDescription: "{{kind}} · {{category}}",
  },
} as const;

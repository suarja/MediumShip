export default {
  screen: {
    title: "Library",
    guestTitle: "Your library, everywhere",
    guestBody:
      "Sign in to save content, sync progress, and gather offline items in one place.",
    guestContinueCta: "Continue as guest",
    signedInTitle: "Library",
    signedInBody:
      "Saved items, resume state, offline, and personal lists move here in the next slice.",
    filters: {
      all: "All",
      articles: "Articles",
      podcasts: "Podcasts",
      offline: "Offline",
    },
    sections: {
      resume: "Resume",
      saved: "Saved",
      lists: "Lists",
      offline: "Offline",
    },
    resumeKicker: "Resume · synced",
    resumeTitle: "The care economy",
    resumeMeta: "Episode · 22:48 left · 62%",
    savedMeta: "Free",
    listsMeta: "Premium",
    offlineTitle: "Download to listen without a network",
    offlineBody: "Offline copies for supported formats appear here in the next slice.",
  },
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  bookmark: {
    saveCta: "Keep",
    savedCta: "Saved",
    saveHint: "Add this format to your personal library.",
    savedHint: "Already stored in your member library.",
  },
  actions: {
    loading: "Checking your member access...",
    signInCta: "Sign in",
    signInHint:
      "Activate your profile to save content, sync progress, and download supported formats.",
    memberCta: "Become a member",
    memberHint:
      "Saved items, synced progress, and offline downloads are reserved for members.",
    memberFooter:
      "Member actions keep your library, sync, and offline copies together.",
    memberFooterWide:
      "Member actions keep your personal library, synced progress, and offline copies in one flow.",
  },
  download: {
    downloadCta: "Offline",
    downloadingCta: "Downloading",
    downloadedCta: "Downloaded",
    downloadHint: "Store this format on this device.",
    downloadedHint: "This copy is already ready offline.",
    memberHint:
      "Articles, episodes, and hosted videos can be downloaded for offline access.",
    youtubeCta: "YouTube",
    youtubeHint: "YouTube videos stay streaming-only.",
    unavailableCta: "Unavailable",
    unavailableHint: "No downloadable source is available for this content.",
  },
  saved: {
    loading: "Loading your saved library...",
    badge: "Saved",
    rowMeta: "Ready to revisit later",
    rowMetaPremium: "Premium · ready to reopen",
    guestTitle: "Keep what deserves a return visit",
    guestHint:
      "Sign in to build your personal library as you read, watch, and listen.",
    memberTitle: "Upgrade to save items",
    memberHint:
      "Member access unlocks persistent bookmarks and synced resumes across devices.",
    emptyTitle: "Your library is waiting for its first marker",
    empty:
      "Save an article, episode, or hosted video to see it here with its cover art.",
    exploreCta: "Explore the catalogue",
  },
  downloads: {
    loading: "Loading your local copies...",
    badge: "Offline",
    rowMeta: "Available without a network on this device",
    guestTitle: "Offline copies arrive with the account",
    guestHint:
      "Sign in to download supported formats and keep them even without a network.",
    memberTitle: "Offline is member-only",
    memberHint:
      "Member access unlocks downloads for articles, episodes, and hosted videos.",
    emptyTitle: "No offline shelf yet",
    empty:
      "Download a supported format to surface its cover art and local copy here.",
    exploreCta: "Find something to download",
  },
} as const;

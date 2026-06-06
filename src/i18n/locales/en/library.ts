export default {
  screen: {
    title: "Library",
    guestTitle: "Your library, everywhere",
    guestBody:
      "Sign in to save content, sync progress, and gather offline items in one place.",
    guestContinueCta: "Continue as guest",
    signedInTitle: "Library",
    signedInBody:
      "Saved items, resume state, offline copies, and personal lists live here once you are signed in.",
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
    savedSubtitle:
      "Everything you chose to keep, across articles, episodes, and videos.",
    listsMeta: "Premium",
    listsTitle: "Lists",
    listsPreviewTitle: "Listen in the car",
    listsPreviewMeta: "9 episodes · private",
    listsBody:
      "Create private lists to queue articles, episodes, and videos for later.",
    offlineSubtitle:
      "Downloads remain reserved for premium-capable formats and member access.",
    offlineTitle: "Download to listen without a network",
    offlineBody:
      "Premium unlocks offline downloads for articles, episodes, and hosted videos.",
  },
  listsScreen: {
    back: "Back",
    createTitle: "Create a list",
    pendingAction: "This action will be available in an upcoming update.",
    lockedTitle: "Unlimited lists with Premium",
    lockedBody:
      "Free members can create one list. Upgrade for unlimited lists and multi-device sync.",
    viewPremiumCta: "See Premium",
    secondPreviewTitle: "Economy — to revisit",
    secondPreviewMeta: "6 items · private",
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
    savedHint: "Already stored in your personal library.",
  },
  actions: {
    loading: "Checking your member access...",
    signInCta: "Sign in",
    signInHint:
      "Activate your profile to save content, sync progress, and download supported formats.",
    memberCta: "Become a member",
    memberHint:
      "Offline downloads and personal lists are reserved for premium members.",
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
    memberTitle: "Saved items are included",
    memberHint:
      "Every signed-in account can keep persistent bookmarks across devices.",
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

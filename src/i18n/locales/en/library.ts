export default {
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  bookmark: {
    loading: "Checking your saved items...",
    signInCta: "Sign in to save",
    signInHint: "Create an account to save this item and sync it across devices.",
    memberCta: "Members can save this",
    memberHint: "Bookmarks sync for members once access is enabled on your account.",
    saveCta: "Save for later",
    savedCta: "Saved",
    savedHint: "This item is in your saved list.",
  },
  saved: {
    sectionTitle: "Saved",
    loading: "Loading your saved items...",
    guestHint: "Sign in to start building your saved list.",
    memberHint: "Saved items are available with member access.",
    empty: "Nothing saved yet. Use the save button on any article, episode, or hosted video.",
    rowDescription: "{{kind}} · {{category}}",
  },
} as const;

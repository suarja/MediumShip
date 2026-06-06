export default {
  title: "Discover",
  subtitle: "Browse what's new and revisit stories from the library.",
  loading: "Loading the feed…",
  emptyTitle: "Nothing to discover yet",
  emptyBody: "Check back soon — new stories land here regularly.",
  actions: {
    skip: "Skip",
    like: "Like",
  },
  sections: {
    editorial: {
      title: "Fresh picks",
      body: "The latest publications to get you started.",
    },
    random: {
      title: "Worth revisiting",
      body: "A story pulled from the library — sometimes a hidden gem.",
    },
    personalized: {
      title: "For you",
      body: "Picked from what you read, listen to, and save.",
    },
    archive: {
      title: "From the archive",
      body: "Older stories that deserve another look.",
    },
  },
} as const;

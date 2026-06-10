export default {
  title: "Your reading of the day",
  historyTitle: "History",
  profileCard: {
    sectionKicker: "Premium",
    title: "Your reading of the day",
    subtitle: "What we've understood from your reading — and what to read next",
    cta: "See my reading",
    empty: "Your first reading of the day is on its way",
    locked: "Premium subscribers only",
    upgrade: "Explore Premium",
  },
  detail: {
    back: "Back",
    dateLabel: "Reading for {{day}}",
    overviewKicker: "Overview",
    reflectionKicker: "Since your last reading",
    trendsKicker: "Trends",
    picksKicker: "Selection",
    relatedTitle: "Our picks for you",
    loading: "Preparing your reading…",
    empty: "No reading of the day available yet.",
    missingBody:
      "The reading could not be generated. Check back tomorrow or rerun the analysis.",
  },
  history: {
    empty: "No past readings yet.",
    rowLabel: "Reading for {{day}}",
  },
  notification: {
    title: "{{appName}}",
    body: "We've followed what you read — here's where it takes you today.",
  },
  invite: {
    kicker: "Premium",
    title: "Your reading of the day is ready",
    body: "We've followed what you read and interpreted where it leads — take a few minutes to see what's next for you.",
    open: "See my reading",
    later: "Not now",
  },
} as const;

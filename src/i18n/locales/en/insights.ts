export default {
  title: "Your briefing",
  historyTitle: "History",
  profileCard: {
    sectionKicker: "Premium",
    title: "Daily briefing",
    subtitle: "What changed in your reading — and what to read next",
    cta: "Read briefing",
    empty: "Your first briefing is on its way",
    locked: "Premium subscribers only",
    upgrade: "Explore Premium",
  },
  detail: {
    back: "Back",
    dateLabel: "Briefing for {{day}}",
    overviewKicker: "Overview",
    reflectionKicker: "Since your last briefing",
    trendsKicker: "Trends",
    picksKicker: "Selection",
    relatedTitle: "Our picks for you",
    loading: "Loading your briefing…",
    empty: "No briefing available yet.",
    missingBody:
      "The report could not be generated. Check back tomorrow or rerun the briefing.",
  },
  history: {
    empty: "No past briefings yet.",
    rowLabel: "Briefing for {{day}}",
  },
  notification: {
    title: "Knowly",
    body: "Your briefing is ready",
  },
  invite: {
    kicker: "Premium",
    title: "Your briefing is ready",
    body: "We've prepared your reading briefing — take a few minutes to see where you stand and what to read next.",
    open: "Read briefing",
    later: "Not now",
  },
} as const;

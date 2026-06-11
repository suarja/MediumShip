export default {
  skip: "Skip",
  manifesto: {
    kicker: "Why this feed",
    title: "Most feeds make you react.",
    titleAccent: "This one makes you think.",
    body: "Social platforms optimise for outrage: their algorithms push whatever goes viral — anger, clashes — and lock you into your bubble. That's the reflex: fast, emotional. Here, we slow down.",
    cta: "Get started",
  },
  selection: {
    kicker: "Where to start",
    title: "Pick what speaks to you.",
    themesLabel: "Your topics",
    readsLabel: "And start with these reads",
    readKicker: "Read",
    cta: "Continue",
    // Placeholder data — replaced at implementation by the real category
    // taxonomy and the curated "Why this feed" collection.
    placeholderThemes: [
      "Society",
      "Economy",
      "Democracy",
      "Ecology",
      "Culture",
      "Science",
      "World",
      "Media",
      "Health",
      "Tech",
    ],
    placeholderReads: [
      "Moral outrage, the fuel of algorithms",
      "Homophily: how your bubble closes in",
      "System 1 / System 2: thinking fast and slow",
      "The attention economy",
      "Virality against nuance",
    ],
  },
  premium: {
    kicker: "◉ Premium — free for now",
    title: "Go further,",
    titleAccent: "without paying.",
    benefits: [
      "Your daily read, every morning",
      "Offline reading",
      "Unlimited personal lists",
      "Members lounge",
    ],
    tryCta: "Try Premium",
    laterCta: "Later",
    note: "No card required. Premium is on the house during launch.",
  },
} as const;

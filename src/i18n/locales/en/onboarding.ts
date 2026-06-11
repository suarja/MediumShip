export default {
  skip: "Skip",
  manifesto: {
    kicker: "Why this feed",
    title: "Most feeds make you react.",
    titleAccent: "This one makes you think.",
    body: "Social platforms optimise for outrage: their algorithms push whatever goes viral — anger, clashes — and lock you into your bubble. That's the reflex: fast, emotional. Here, we slow down.",
    readsLabel: "Start with these reads",
    readKicker: "Read",
    // Placeholder reads — replaced at implementation by the curated
    // "Why this feed" collection.
    placeholderReads: [
      "Moral outrage, the fuel of algorithms",
      "Homophily: how your bubble closes in",
      "System 1 / System 2: thinking fast and slow",
      "The attention economy",
      "Virality against nuance",
    ],
    cta: "Get started",
  },
  categories: {
    kicker: "Where to start",
    title: "Pick what speaks to you.",
    cta: "Continue",
  },
  premium: {
    kicker: "◉ Premium — free for now",
    title: "Go further,",
    titleAccent: "without paying.",
    subtitle: "Everything the free account opens, made fuller.",
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

export default {
  title: "Explore",
  searchPlaceholder: "Search analyses, podcasts, events…",
  searchResultsAll: "All",
  searchResultsArticles: "Articles",
  searchResultsPodcasts: "Podcasts",
  searchResultsVideos: "Videos",
  searchEmpty: "No results for this search.",
  categoriesTitle: "Categories",
  modulesTitle: "Modules",
  trendsTitle: "This week",
  categories: {
    analyses: {
      title: "Analyses",
      meta: "Explore",
    },
    podcasts: {
      title: "Podcasts",
      meta: "Listen",
    },
    videos: {
      title: "Videos",
      meta: "Watch",
    },
  },
  modules: {
    collections: {
      title: "Collections",
      meta: "By the newsroom",
    },
    agenda: {
      title: "Agenda",
      meta: "Events and circles",
    },
    community: {
      title: "Community",
      meta: "Discord and circles",
    },
  },
  category: {
    backToExplore: "Back to Explore",
    loading: "Loading category…",
    empty: "No published content in this category.",
  },
  categoryCount_one: "{{count}} content",
  categoryCount_other: "{{count}} contents",
  trendA11y: "Search for {{label}}",
} as const;

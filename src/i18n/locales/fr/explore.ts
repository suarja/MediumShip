export default {
  title: "Explorer",
  searchPlaceholder: "Chercher analyses, podcasts, événements…",
  searchResultsAll: "Tout",
  searchResultsArticles: "Articles",
  searchResultsPodcasts: "Podcasts",
  searchResultsVideos: "Vidéos",
  searchEmpty: "Aucun résultat pour cette recherche.",
  categoriesTitle: "Catégories",
  modulesTitle: "Modules",
  trendsTitle: "Cette semaine",
  categories: {
    analyses: {
      title: "Analyses",
      meta: "À explorer",
    },
    podcasts: {
      title: "Podcasts",
      meta: "À écouter",
    },
    videos: {
      title: "Vidéos",
      meta: "À regarder",
    },
  },
  modules: {
    collections: {
      title: "Collections",
      meta: "Par la rédaction",
    },
    agenda: {
      title: "Agenda",
      meta: "Événements et cercles",
    },
    community: {
      title: "Communauté",
      meta: "Discord et cercles",
    },
  },
  category: {
    backToExplore: "Retour vers Explorer",
    loading: "Chargement de la catégorie…",
    empty: "Aucun contenu publié dans cette catégorie.",
  },
  categoryCount_one: "{{count}} contenu",
  categoryCount_other: "{{count}} contenus",
  trendA11y: "Chercher {{label}}",
} as const;

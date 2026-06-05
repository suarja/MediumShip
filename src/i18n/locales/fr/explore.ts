export default {
  title: "Explorer",
  searchPlaceholder: "Chercher analyses, podcasts, evenements…",
  categoriesTitle: "Categories",
  modulesTitle: "Modules",
  trendsTitle: "Cette semaine",
  categories: {
    analyses: {
      title: "Analyses",
      meta: "Lectures longues et briefings editoriaux",
    },
    podcasts: {
      title: "Podcasts",
      meta: "Entretiens, series et conversations",
    },
    videos: {
      title: "Videos",
      meta: "Debats, formats et decryptages",
    },
    agenda: {
      title: "Agenda",
      meta: "Evenements et rendez-vous a venir",
    },
  },
  modules: {
    collections: {
      title: "Collections",
      meta: "Parcours editoriaux construits par la redaction",
    },
    community: {
      title: "Communaute",
      meta: "Cercles externes, Discord et espaces membres",
    },
  },
  trends: {
    programme2027: "Programme 2027",
    localDemocracy: "Democratie locale",
    careEconomy: "Economie du soin",
    purchasingPower: "Pouvoir d'achat",
  },
} as const;

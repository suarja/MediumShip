export default {
  title: "Découvrir",
  subtitle: "Un fil pour parcourir l'actualité et redécouvrir la bibliothèque.",
  loading: "Chargement du fil…",
  emptyTitle: "Rien à découvrir pour le moment",
  emptyBody: "Revenez bientôt : de nouveaux contenus arrivent régulièrement.",
  actions: {
    like: "Aimer",
    more: "Plus d'actions",
    notInterested: "Pas intéressé",
  },
  source: {
    wikipedia: "Wikipedia",
  },
  sections: {
    editorial: {
      title: "À la une",
      body: "Les publications les plus récentes, pour prendre le fil.",
    },
    random: {
      title: "À redécouvrir",
      body: "Un contenu tiré de la bibliothèque — parfois une pépite oubliée.",
    },
    personalized: {
      title: "Pour vous",
      body: "Sélectionnés à partir de ce que vous lisez et écoutez.",
    },
    archive: {
      title: "Des archives",
      body: "Des contenus plus anciens qui méritent un second regard.",
    },
  },
} as const;

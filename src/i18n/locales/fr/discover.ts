export default {
  title: "Découvrir",
  subtitle: "Un fil pour parcourir l'actualité et redécouvrir la bibliothèque.",
  loading: "Chargement du fil…",
  loadingMore: "Chargement…",
  emptyTitle: "Rien à découvrir pour le moment",
  emptyBody: "Revenez bientôt : de nouveaux contenus arrivent régulièrement.",
  endOfFeedTitle: "Vous êtes à jour",
  endOfFeedBodyWithArchive:
    "Vous avez parcouru les nouveautés. Continuez à défiler pour les archives.",
  endOfFeedBodyCaughtUp:
    "Vous avez tout parcouru pour l'instant. De nouveaux contenus s'ajoutent ici dès qu'ils arrivent en arrière-plan.",
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

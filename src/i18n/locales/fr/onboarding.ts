export default {
  skip: "Passer",
  manifesto: {
    kicker: "Pourquoi ce fil",
    title: "La plupart des fils te font réagir.",
    titleAccent: "Celui-ci te fait réfléchir.",
    body: "Les réseaux optimisent l'indignation : leurs algorithmes poussent ce qui rend viral — la colère, le clash — et t'enferment dans ta bulle. C'est le réflexe : rapide, émotionnel. Ici, on ralentit.",
    cta: "Commencer",
  },
  selection: {
    kicker: "Par où commencer",
    title: "Choisis ce qui t'interpelle.",
    themesLabel: "Tes thèmes",
    readsLabel: "Et commence par ces lectures",
    readKicker: "À lire",
    cta: "Continuer",
    // Placeholder data — replaced at implementation by the real category
    // taxonomy and the curated "Pourquoi ce fil" collection.
    placeholderThemes: [
      "Société",
      "Économie",
      "Démocratie",
      "Écologie",
      "Culture",
      "Sciences",
      "International",
      "Médias",
      "Santé",
      "Tech",
    ],
    placeholderReads: [
      "L'indignation morale, carburant des algorithmes",
      "Homophilie : comment ta bulle se referme",
      "Système 1 / Système 2 : penser vite, penser lentement",
      "L'économie de l'attention",
      "La viralité contre la nuance",
    ],
  },
  premium: {
    kicker: "◉ Premium — gratuit pour l'instant",
    title: "Va plus loin,",
    titleAccent: "sans payer.",
    benefits: [
      "Ta lecture du jour, chaque matin",
      "Lecture hors-ligne",
      "Listes personnelles illimitées",
      "Salon membres",
    ],
    tryCta: "Essayer Premium",
    laterCta: "Plus tard",
    note: "Aucune carte requise. Premium est offert pendant le lancement.",
  },
} as const;

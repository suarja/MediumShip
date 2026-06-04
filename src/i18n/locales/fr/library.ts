export default {
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  bookmark: {
    saveCta: "Enregistrer pour plus tard",
    savedCta: "Enregistre",
  },
  actions: {
    loading: "Verification de vos actions membres...",
    signInCta: "Se connecter pour enregistrer ou telecharger",
    signInHint:
      "Creez un compte pour enregistrer des contenus, synchroniser la progression et telecharger les formats pris en charge.",
    memberCta: "Reserve aux membres",
    memberHint:
      "Les enregistrements, la progression synchronisee et les telechargements hors ligne sont reserves aux membres.",
  },
  download: {
    downloadCta: "Telecharger hors ligne",
    downloadingCta: "Telechargement...",
    downloadedCta: "Telecharge",
    downloadedHint: "Cette copie est stockee sur l'appareil pour la lecture hors ligne.",
    memberHint:
      "Les articles, episodes et videos hebergees peuvent etre telecharges pour un acces hors ligne.",
    youtubeCta: "YouTube uniquement",
    youtubeHint: "Les videos YouTube restent en streaming et ne sont pas telechargeables.",
    unavailableCta: "Indisponible",
  },
  saved: {
    sectionTitle: "Enregistres",
    loading: "Chargement de vos contenus enregistres...",
    guestHint: "Connectez-vous pour commencer votre liste d'enregistrements.",
    memberHint: "Les enregistrements sont disponibles avec l'acces membre.",
    empty:
      "Aucun contenu enregistre pour l'instant. Utilisez le bouton sur un article, un episode ou une video hebergee.",
    rowDescription: "{{kind}} · {{category}}",
  },
  downloads: {
    sectionTitle: "Telechargements",
    loading: "Chargement de vos telechargements...",
    guestHint: "Connectez-vous pour debloquer les telechargements hors ligne sur les contenus pris en charge.",
    memberHint: "Les telechargements hors ligne sont disponibles avec l'acces membre.",
    empty:
      "Aucun telechargement pour l'instant. Telechargez un article, un episode ou une video hebergee pour le garder sur cet appareil.",
    rowDescription: "{{kind}} · {{category}}",
  },
} as const;

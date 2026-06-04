export default {
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  bookmark: {
    loading: "Verification de vos contenus enregistres...",
    signInCta: "Se connecter pour enregistrer",
    signInHint:
      "Creez un compte pour enregistrer ce contenu et le retrouver sur tous vos appareils.",
    memberCta: "Reserve aux membres",
    memberHint:
      "Les enregistrements se synchronisent pour les membres une fois l'acces active sur le compte.",
    saveCta: "Enregistrer pour plus tard",
    savedCta: "Enregistre",
    savedHint: "Ce contenu est deja dans votre liste.",
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
} as const;

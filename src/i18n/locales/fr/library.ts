export default {
  screen: {
    title: "Bibliotheque",
    guestTitle: "Votre bibliotheque, partout",
    guestBody:
      "Connectez-vous pour enregistrer des contenus, synchroniser la progression et reunir vos contenus hors ligne au meme endroit.",
    guestContinueCta: "Continuer en invite",
    signedInTitle: "Bibliotheque",
    signedInBody:
      "Les favoris, la reprise, le hors ligne et les listes personnelles vivent ici une fois connecte.",
    filters: {
      all: "Tout",
      articles: "Articles",
      podcasts: "Podcasts",
      offline: "Hors ligne",
    },
    sections: {
      resume: "Reprendre",
      saved: "Favoris",
      lists: "Listes",
      briefing: "Lectures du jour",
      offline: "Hors ligne",
    },
    resumeKicker: "Reprendre",
    resumeMetaWithRemaining: "{{kind}} · {{remaining}} restantes · {{percent}}%",
    resumeMetaPercentOnly: "{{kind}} · {{percent}}%",
    savedMeta: "Gratuit",
    savedSubtitle:
      "Tous les contenus que vous avez choisi de garder, quel que soit le format.",
    listsMeta: "Premium",
    listsTitle: "Listes",
    listsPreviewTitle: "A ecouter en voiture",
    listsPreviewMeta: "9 episodes · privee",
    listsBody:
      "Creez des listes privees pour mettre articles, episodes et videos en file d'attente.",
    offlineSubtitle:
      "Les telechargements restent reserves aux formats compatibles et aux membres premium.",
    offlineTitle: "Telecharger pour ecouter sans reseau",
    offlineBody:
      "Le premium debloque les telechargements hors ligne pour les articles, episodes et videos hebergees.",
    briefingTitle: "Tes lectures du jour, au même endroit",
    briefingBody:
      "Le premium débloque un compagnon qui interprète tes lectures et te propose quoi lire ensuite.",
    briefingPreviewTitle: "Tes lectures du jour",
    briefingPreviewMeta: "Propositions personnalisées et interprétation de tes goûts",
    seeAll: "Voir tout",
  },
  favoritesScreen: {
    back: "Retour",
    title: "Tous mes favoris",
  },
  downloadsScreen: {
    back: "Retour",
    title: "Tous mes telechargements",
  },
  historyScreen: {
    back: "Retour",
    title: "Historique & progression",
    empty: "Aucun contenu consulte pour l'instant. Ouvrez un article, un episode ou une video pour le retrouver ici.",
    clear: "Effacer",
    clearConfirmTitle: "Effacer l'historique ?",
    clearConfirmBody:
      "Votre historique de consultation sera masque sur cet appareil. Vos signaux d'affinite restent intacts.",
    clearConfirmCta: "Effacer l'historique",
    cancel: "Annuler",
    guestTitle: "Historique reserve aux membres",
    guestBody:
      "Connectez-vous avec un compte membre et activez la synchronisation de progression pour retrouver vos lectures et ecoutes recentes.",
    rowMeta: "{{kind}} · consulte le {{date}}",
    rowMetaWithProgress: "{{kind}} · consulte le {{date}} · {{percent}}%",
  },
  listsScreen: {
    back: "Retour",
    createTitle: "Creer une liste",
    pendingAction: "Cette action sera disponible dans une prochaine mise a jour.",
    lockedTitle: "Listes illimitees avec Premium",
    lockedBody:
      "Les membres gratuits creent 1 liste. Passez Premium pour des listes illimitees et la synchro multi-appareils.",
    viewPremiumCta: "Voir Premium",
    secondPreviewTitle: "Economie — a relire",
    secondPreviewMeta: "6 contenus · privee",
  },
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  list: {
    addCta: "Liste",
    inListCta: "En liste",
  },
  bookmark: {
    saveCta: "Favoris",
    savedCta: "En favoris",
    saveHint: "Ajoutez ce format a votre bibliotheque personnelle.",
    savedHint: "Deja range dans votre bibliotheque personnelle.",
  },
  actions: {
    loading: "Verification de vos droits membres...",
    signInCta: "Se connecter",
    signInHint:
      "Activez votre profil pour enregistrer des contenus, synchroniser la progression et telecharger les formats pris en charge.",
    memberCta: "Devenir membre",
    memberHint:
      "Les telechargements hors ligne et les listes personnelles sont reserves aux membres premium.",
    memberFooter:
      "Les actions membres gardent votre bibliotheque, votre sync et vos copies offline au meme endroit.",
    memberFooterWide:
      "Les actions membres gardent votre bibliotheque personnelle, la synchro de progression et les copies hors ligne dans un meme flux.",
  },
  download: {
    downloadCta: "Hors ligne",
    downloadingCta: "Telechargement",
    downloadedCta: "Telecharge",
    downloadHint: "Stocker ce format sur cet appareil.",
    downloadedHint: "Cette copie est deja disponible hors ligne.",
    memberHint:
      "Les articles, episodes et videos hebergees peuvent etre telecharges pour un acces hors ligne.",
    youtubeCta: "YouTube",
    youtubeHint: "Les videos YouTube restent en streaming.",
    unavailableCta: "Indisponible",
    unavailableHint: "Aucune source telechargeable n'est disponible pour ce contenu.",
  },
  saved: {
    loading: "Chargement de votre bibliotheque gardee...",
    badge: "Garde",
    rowMeta: "Pret a relire plus tard",
    rowMetaPremium: "Premium · pret a retrouver",
    guestTitle: "Gardez ce qui merite de revenir",
    guestHint: "Connectez-vous pour construire votre bibliotheque personnelle au fil de vos lectures et ecoutes.",
    memberTitle: "Les favoris sont inclus",
    memberHint:
      "Chaque compte connecte peut garder des favoris persistants sur ses appareils.",
    emptyTitle: "Votre bibliotheque attend son premier favori",
    empty:
      "Ajoutez un article, un episode ou une video hebergee a vos favoris pour les retrouver ici avec leurs couvertures.",
    exploreCta: "Explorer le catalogue",
  },
  downloads: {
    loading: "Chargement de vos copies locales...",
    badge: "Offline",
    rowMeta: "Disponible sans reseau sur cet appareil",
    guestTitle: "Les copies hors ligne arrivent avec le compte",
    guestHint: "Connectez-vous pour telecharger les formats pris en charge et les retrouver meme sans reseau.",
    memberTitle: "Le hors ligne est reserve aux membres",
    memberHint: "L'acces membre debloque les telechargements pour les articles, episodes et videos hebergees.",
    emptyTitle: "Aucune etagere offline pour l'instant",
    empty:
      "Telechargez un contenu pris en charge pour voir apparaitre ici sa couverture et sa copie locale.",
    exploreCta: "Trouver un contenu a telecharger",
  },
} as const;

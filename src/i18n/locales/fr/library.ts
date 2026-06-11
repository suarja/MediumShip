export default {
  screen: {
    title: "Bibliothèque",
    guestTitle: "Votre bibliothèque, partout",
    guestBody:
      "Connectez-vous pour enregistrer des contenus, synchroniser la progression et réunir vos contenus hors ligne au même endroit.",
    guestContinueCta: "Continuer en invité",
    signedInTitle: "Bibliothèque",
    signedInBody:
      "Les favoris, la reprise, le hors ligne et les listes personnelles vivent ici une fois connecté.",
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
    listsPreviewTitle: "À écouter en voiture",
    listsPreviewMeta: "9 épisodes · privée",
    listsBody:
      "Créez des listes privées pour mettre articles, épisodes et vidéos en file d'attente.",
    offlineSubtitle:
      "Les téléchargements restent réservés aux formats compatibles et aux membres premium.",
    offlineTitle: "Télécharger pour écouter sans réseau",
    offlineBody:
      "Le premium débloque les téléchargements hors ligne pour les articles, épisodes et vidéos hébergées.",
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
    title: "Tous mes téléchargements",
  },
  historyScreen: {
    back: "Retour",
    title: "Historique & progression",
    empty: "Aucun contenu consulté pour l'instant. Ouvrez un article, un épisode ou une vidéo pour le retrouver ici.",
    clear: "Effacer",
    clearConfirmTitle: "Effacer l'historique ?",
    clearConfirmBody:
      "Votre historique de consultation sera masqué sur cet appareil. Vos signaux d'affinité restent intacts.",
    clearConfirmCta: "Effacer l'historique",
    cancel: "Annuler",
    guestTitle: "Historique réservé aux membres",
    guestBody:
      "Connectez-vous avec un compte membre et activez la synchronisation de progression pour retrouver vos lectures et écoutes récentes.",
    rowMeta: "{{kind}} · consulté le {{date}}",
    rowMetaWithProgress: "{{kind}} · consulté le {{date}} · {{percent}}%",
  },
  listsScreen: {
    back: "Retour",
    createTitle: "Créer une liste",
    pendingAction: "Cette action sera disponible dans une prochaine mise à jour.",
    lockedTitle: "Listes illimitées avec Premium",
    lockedBody:
      "Les membres gratuits créent 1 liste. Passez Premium pour des listes illimitées et la synchro multi-appareils.",
    viewPremiumCta: "Voir Premium",
    secondPreviewTitle: "Économie — à relire",
    secondPreviewMeta: "6 contenus · privée",
  },
  kinds: {
    article: "Article",
    episode: "Épisode",
    video: "Vidéo",
  },
  list: {
    addCta: "Liste",
    inListCta: "En liste",
  },
  bookmark: {
    saveCta: "Favoris",
    savedCta: "En favoris",
    saveHint: "Ajoutez ce format à votre bibliothèque personnelle.",
    savedHint: "Déjà rangé dans votre bibliothèque personnelle.",
  },
  actions: {
    loading: "Vérification de vos droits membres...",
    signInCta: "Se connecter",
    signInHint:
      "Activez votre profil pour enregistrer des contenus, synchroniser la progression et télécharger les formats pris en charge.",
    memberCta: "Devenir membre",
    memberHint:
      "Les téléchargements hors ligne et les listes personnelles sont réservés aux membres premium.",
    memberFooter:
      "Les actions membres gardent votre bibliothèque, votre sync et vos copies offline au même endroit.",
    memberFooterWide:
      "Les actions membres gardent votre bibliothèque personnelle, la synchro de progression et les copies hors ligne dans un même flux.",
  },
  download: {
    downloadCta: "Hors ligne",
    downloadingCta: "Téléchargement",
    downloadedCta: "Téléchargé",
    downloadHint: "Stocker ce format sur cet appareil.",
    downloadedHint: "Cette copie est déjà disponible hors ligne.",
    memberHint:
      "Les articles, épisodes et vidéos hébergées peuvent être téléchargés pour un accès hors ligne.",
    youtubeCta: "YouTube",
    youtubeHint: "Les vidéos YouTube restent en streaming.",
    unavailableCta: "Indisponible",
    unavailableHint: "Aucune source téléchargeable n'est disponible pour ce contenu.",
  },
  saved: {
    loading: "Chargement de votre bibliothèque gardée...",
    badge: "Gardé",
    rowMeta: "Prêt à relire plus tard",
    rowMetaPremium: "Premium · prêt à retrouver",
    guestTitle: "Gardez ce qui mérite de revenir",
    guestHint: "Connectez-vous pour construire votre bibliothèque personnelle au fil de vos lectures et écoutes.",
    memberTitle: "Les favoris sont inclus",
    memberHint:
      "Chaque compte connecté peut garder des favoris persistants sur ses appareils.",
    emptyTitle: "Votre bibliothèque attend son premier favori",
    empty:
      "Ajoutez un article, un épisode ou une vidéo hébergée à vos favoris pour les retrouver ici avec leurs couvertures.",
    exploreCta: "Explorer le catalogue",
  },
  downloads: {
    loading: "Chargement de vos copies locales...",
    badge: "Offline",
    rowMeta: "Disponible sans réseau sur cet appareil",
    guestTitle: "Les copies hors ligne arrivent avec le compte",
    guestHint: "Connectez-vous pour télécharger les formats pris en charge et les retrouver même sans réseau.",
    memberTitle: "Le hors ligne est réservé aux membres",
    memberHint: "L'accès membre débloque les téléchargements pour les articles, épisodes et vidéos hébergées.",
    emptyTitle: "Aucune étagère offline pour l'instant",
    empty:
      "Téléchargez un contenu pris en charge pour voir apparaître ici sa couverture et sa copie locale.",
    exploreCta: "Trouver un contenu à télécharger",
  },
} as const;

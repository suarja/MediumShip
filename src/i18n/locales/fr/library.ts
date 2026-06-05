export default {
  screen: {
    title: "Bibliotheque",
    guestTitle: "Votre bibliotheque, partout",
    guestBody:
      "Connectez-vous pour enregistrer des contenus, synchroniser la progression et reunir vos contenus hors ligne au meme endroit.",
    guestContinueCta: "Continuer en invite",
    signedInTitle: "Bibliotheque",
    signedInBody:
      "Les enregistrements, la reprise, le hors ligne et les listes personnelles arrivent ici dans la prochaine slice.",
    filters: {
      all: "Tout",
      articles: "Articles",
      podcasts: "Podcasts",
      offline: "Hors ligne",
    },
    sections: {
      resume: "Reprendre",
      saved: "Enregistres",
      lists: "Listes",
      offline: "Hors ligne",
    },
    resumeKicker: "Reprendre · synchronise",
    resumeTitle: "L'economie du soin",
    resumeMeta: "Episode · 22:48 restantes · 62%",
    savedMeta: "Gratuit",
    listsMeta: "Premium",
    offlineTitle: "Telecharger pour ecouter sans reseau",
    offlineBody: "Les copies hors ligne pour les formats pris en charge apparaissent ici dans la prochaine slice.",
  },
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  bookmark: {
    saveCta: "Garder",
    savedCta: "Garde",
    saveHint: "Ajoutez ce format a votre bibliotheque personnelle.",
    savedHint: "Deja range dans votre bibliotheque membre.",
  },
  actions: {
    loading: "Verification de vos droits membres...",
    signInCta: "Se connecter",
    signInHint:
      "Activez votre profil pour enregistrer des contenus, synchroniser la progression et telecharger les formats pris en charge.",
    memberCta: "Devenir membre",
    memberHint:
      "Les enregistrements, la progression synchronisee et les telechargements hors ligne sont reserves aux membres.",
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
    memberTitle: "Passez membre pour enregistrer",
    memberHint: "L'acces membre active les bookmarks persistants et la synchronisation de vos reprises.",
    emptyTitle: "Votre bibliotheque attend son premier repere",
    empty:
      "Enregistrez un article, un episode ou une video hebergee pour les retrouver ici avec leurs couvertures.",
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

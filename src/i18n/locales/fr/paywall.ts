export default {
  reasons: {
    offline: {
      eyebrow: "◉ Telechargement hors-ligne · Premium",
      title: "Ecoutez partout, ",
      titleItalic: "meme sans reseau.",
      description:
        "Le telechargement hors-ligne est reserve aux membres Premium. La lecture en ligne reste gratuite.",
      dismissCta: "CONTINUER L'ÉCOUTE EN LIGNE — GRATUIT",
    },
    lists: {
      eyebrow: "◉ Listes illimitees · Premium",
      title: "Organisez ",
      titleItalic: "sans limite.",
      description:
        "Les listes personnelles illimitees et la synchro multi-appareils sont reservees a Premium.",
      dismissCta: "CONTINUER SANS LISTES — GRATUIT",
    },
    members: {
      eyebrow: "◉ Salon membres · Premium",
      title: "Entrez dans ",
      titleItalic: "les coulisses.",
      description:
        "Le salon membres (AMA, votes, coulisses) est reserve aux abonnes Premium.",
      dismissCta: "EXPLORER GRATUITEMENT",
    },
    content: {
      eyebrow: "◉ Contenu premium",
      title: "Soutenez. ",
      titleItalic: "Accedez a tout.",
      description:
        "Ce contenu est reserve aux membres Premium. Votre abonnement finance le travail editorial.",
      dismissCta: "CONTINUER SANS CE CONTENU — GRATUIT",
    },
    support: {
      eyebrow: "◉ Acces Premium",
      title: "Soutenez. ",
      titleItalic: "Recevez plus.",
      description:
        "Tous les contenus, l'offline, les listes et le salon membres.",
      dismissCta: "PLUS TARD — CONTINUER GRATUITEMENT",
    },
  },
  benefits: [
    "Telechargements illimites hors-ligne",
    "Reprise synchronisee sur vos appareils",
    "Listes personnelles illimitees + salon membres",
  ],
  signInCta: "Se connecter pour continuer",
  becomeMemberCta: "Devenir membre",
  purchaseCtaWithPrice: "Devenir membre · {{price}}",
  purchaseCta: "Passer Premium — {{price}}/mois",
  purchaseCtaFallback: "Devenir membre",
  packageBestValue: "Meilleure offre",
  trialNote: "2 semaines d'essai gratuites, puis facturation mensuelle. Resiliable a tout moment.",
  restoreCta: "Restaurer les achats",
  purchasing: "Traitement…",
  purchaseSuccess: "Bienvenue en Premium ! Ton acces se debloque dans un instant.",
  purchaseCancelled: "Achat annule.",
  purchaseError: "L'achat a echoue. Reessaie.",
  alreadySubscribed: "Tu as deja un abonnement Premium actif.",
  restoreSuccess: "Achats restaures. Ton acces se debloque dans un instant.",
  restoreError: "Aucun abonnement actif trouve.",
  webPurchaseHint:
    "L'achat in-app n'est pas disponible sur le web. Ouvre l'app iOS ou Android (build de dev) pour t'abonner.",
  offeringUnavailable: "Offre Premium indisponible pour le moment.",
  offeringRetryCta: "Reessayer",
  loadingOffering: "Chargement de l'offre…",
  packageMonthly: "Mensuel",
  packageAnnual: "Annuel",
  packageLifetime: "À vie",
  packageTrialFree: "Essai gratuit inclus",
  packageTrialIntro: "Essai à {{price}}",
  celebrationTitle: "Ouais !",
  celebrationBody: "Bienvenue en Premium. Ton accès se débloque tout de suite.",
  celebrationCta: "C'est parti",
  pendingTitle: "Acces membre pas encore actif",
  pendingBody:
    "Ton compte est connecte mais n'a pas encore l'acces membre. Il est active par l'equipe.",
  crestFallback: "M",
} as const;

export default {
  title: "Profil",
  guestTitle: "Crée ton profil.",
  guestName: "Lecteur invité",
  guestBio:
    "La lecture reste ouverte. Crée un compte pour enregistrer tes formats favoris et synchroniser ta progression. Premium ajoute le hors-ligne et les listes personnelles.",
  createAccount: "Créer un compte",
  discoverPremium: "Découvrir Premium",
  status: {
    memberFree: "Membre · Gratuit",
    memberPremium: "Membre · Premium",
  },
  since: {
    member: "Ton abonnement est actif",
    upgrade: "Compte gratuit · passe à Premium",
  },
  stats: {
    savedLabel: "Favoris",
    offlineLabel: "Hors-ligne",
    historyLabel: "Historique",
  },
  sections: {
    myLibrary: "Ma bibliothèque",
    account: "Compte",
  },
  rows: {
    saved: {
      title: "Favoris",
      sub_one: "{{count}} favori",
      sub_other: "{{count}} favoris",
    },
    downloads: {
      title: "Téléchargements",
      subMember_one: "{{count}} épisode hors-ligne",
      subMember_other: "{{count}} épisodes hors-ligne",
      sub: "Réservé aux membres Premium",
    },
    lists: {
      title: "Mes listes",
      sub: "1 liste · illimité avec Premium",
      subMember_one: "{{count}} liste · privée",
      subMember_other: "{{count}} listes · privées",
      subMemberEmpty: "Crée ta première liste",
    },
    history: {
      title: "Historique & progression",
      sub: "Reprise synchronisée sur tes appareils",
    },
    briefing: {
      title: "Lectures du jour",
      sub: "Lectures interprétées · Premium",
      subMember_one: "{{count}} lecture enregistrée",
      subMember_other: "{{count}} lectures enregistrées",
      subMemberEmpty: "Tes lectures du jour",
    },
    subscription: {
      title: "Abonnement Premium",
      sub: "Gérer ou résilier ton abonnement",
    },
    subscriptionAccess: {
      title: "Ton accès Premium",
      sub: "Découvre tes avantages",
    },
    goPremium: {
      title: "Passer Premium",
      sub: "Hors-ligne, listes illimitées, salon membres",
    },
    signOut: {
      title: "Se déconnecter",
      sub: "Repasser en mode invité",
    },
  },
  badges: {
    premium: "Premium",
  },
} as const;

export default {
  title: "Profil",
  eyebrow: "Votre profil",
  guestTitle: "Creez votre profil.",
  guestName: "Lecteur invité",
  guestBio:
    "La lecture reste ouverte. Creez un compte pour enregistrer vos formats favoris et synchroniser votre progression. Premium ajoute le hors ligne et les listes personnelles.",
  signedInBio:
    "Votre compte synchronise vos formats enregistres et votre progression. Premium ajoute le hors ligne et les listes personnelles.",
  memberBio:
    "Un profil pense pour garder vos lectures, reprendre vos ecoutes et retrouver vos formats favoris sans friction.",
  memberBioActive:
    "Votre collection est en mouvement: contenus gardes, copies hors ligne et progression synchronisee restent a portee de main.",
  heroMetaGuest: "Lecture ouverte · compte optionnel",
  heroMetaSignedIn: "Compte connecte · options membres disponibles",
  heroMetaMember: "Membre actif · synchro prete",
  heroChipSaved_one: "{{count}} enregistre",
  heroChipSaved_other: "{{count}} enregistres",
  heroChipDownloaded_one: "{{count}} hors ligne",
  heroChipDownloaded_other: "{{count}} hors ligne",
  createAccount: "Creer un compte",
  guestNote:
    "Votre profil se concentre maintenant sur l'identite, le statut du compte et les reglages. Les contenus enregistres et hors ligne vivent dans Bibliotheque.",
  status: {
    memberFree: "Membre · Gratuit",
    memberPremium: "Membre · Bienfaiteur",
  },
  since: {
    member: "Synchro prete · depuis mars 2024",
    upgrade: "Compte gratuit · passez Premium",
  },
  stats: {
    savedLabel: "Enregistres",
    savedHint: "Voir Bibliotheque",
    offlineLabel: "Hors-ligne",
    historyLabel: "Historique",
    downloadedLabel: "Telecharges",
    downloadedHint: "Voir Bibliotheque",
    accessLabel: "Acces",
    memberHint: "Premium actif",
    guestHint: "Invite ou compte standard",
    syncLabel: "Sync",
    syncReady: "Convex et Clerk alignes",
    syncPending: "Actions locales ou session invitee",
  },
  sections: {
    myLibrary: "Ma bibliotheque",
    account: "Compte",
    libraryTitle: "Bibliotheque gardee",
    librarySubtitle: "Retrouvez rapidement les contenus que vous voulez garder sous la main.",
    downloadsTitle: "Etagere hors ligne",
    downloadsSubtitle: "Vos copies locales avec couverture, format et acces immediat sans reseau.",
  },
  rows: {
    saved: {
      title: "Enregistrements",
      sub_one: "{{count}} contenu mis de cote",
      sub_other: "{{count}} contenus mis de cote",
    },
    downloads: {
      title: "Telechargements",
      subMember_one: "{{count}} episode hors ligne",
      subMember_other: "{{count}} episodes hors ligne",
      sub: "Reserve aux membres Premium",
    },
    lists: {
      title: "Mes listes",
      sub: "Illimite avec Premium",
    },
    history: {
      title: "Historique & progression",
      sub: "Reprise synchronisee sur vos appareils",
    },
    subscription: {
      title: "Abonnement · Annuel",
      sub: "Renouvellement le 14 mars 2027",
    },
    goPremium: {
      title: "Passer Premium",
      sub: "Offline, listes illimitees, salon membres",
    },
    signOut: {
      title: "Se deconnecter",
      sub: "Repasser en mode invite",
    },
  },
  badges: {
    free: "Gratuit",
    member: "Membre",
    premium: "Premium",
  },
} as const;

export default {
  title: "Réglages",
  subtitle: "Gérez la langue et l'identité visuelle du client.",
  sections: {
    general: "Général",
    account: "Compte",
    debug: "Debug",
  },
  language: {
    label: "Langue",
    description: "Choisissez la langue de l'application mobile.",
    fr: "Français",
    en: "Anglais",
  },
  appearance: {
    themeLabel: "Palette",
    themeDescription:
      "Choisissez le preset visuel du tenant. La base de données ne stocke que le nom de cette palette.",
    palettes: {
      brick: {
        label: "Brique éditoriale",
        description: "Chaleureux, premium et magazine.",
      },
      fjord: {
        label: "Fjord clair",
        description: "Plus frais, plus net, plus produit.",
      },
      canopy: {
        label: "Canopée",
        description: "Vert feutré, plus institutionnel.",
      },
      midnight: {
        label: "Minuit",
        description: "Version sombre, dense et contrastée.",
      },
      onde: {
        label: "Onde Bourgogne",
        description: "Bordeaux profond, littéraire et premium.",
      },
      boussole: {
        label: "Boussole Cobalt",
        description: "Cobalt froid, analytique et civique.",
      },
      commune: {
        label: "Commune Chaude",
        description: "Ocre chaleureux, humaniste et engageant.",
      },
    },
  },
  interests: {
    label: "Centres d'intérêt",
    description:
      "Choisissez des catégories à prioriser dans Découvrir et les prochains fetchs.",
    pickerDescription:
      "Les catégories choisies boostent le feed immédiatement. Likes et historique restent intacts.",
    noneSelected: "Aucune sélection",
    selectedCount: "{{count}} sélectionnée(s)",
    signInPrompt: "Connectez-vous pour choisir des catégories",
    searchPlaceholder: "Rechercher une catégorie…",
    searchEmpty: "Aucune catégorie pour « {{query}} ».",
    subthemesOf: "Sous {{label}}",
  },
  account: {
    status: "Statut",
    guest: "Invité",
    memberFeatures: "Réservé aux membres",
    memberFeaturesDescription:
      "Créez un compte pour synchroniser la progression, enregistrer des contenus, télécharger les formats pris en charge et accéder aux fonctions premium.",
    signedInAs: "Connecté en tant que",
    signOut: "Se déconnecter",
  },
  debug: {
    panelLabel: "Panneau debug",
    panelDescription:
      "Ouvrir les données techniques du compte, de l'identité Convex et les surcharges réseau.",
    back: "Retour aux réglages",
    title: "Debug",
    subtitle:
      "Surface réservée au développement pour inspecter l'état de session, l'identité Convex et les états réseau.",
    sections: {
      session: "Session",
      identity: "Identité",
      network: "Réseau",
    },
    rows: {
      auth: "État auth",
      convex: "État Convex",
      member: "Membre",
      userId: "User ID",
      name: "Nom Clerk",
      email: "Email",
      stored: "Stocké dans Convex",
      clerkId: "Clerk ID",
      tokenIdentifier: "Token identifier",
      avatar: "Avatar",
      displayName: "Nom résolu",
      networkRuntime: "État réseau runtime",
    },
    network: {
      label: "Surcharge d'état réseau",
      description:
        "Surcharge réservée au développement pour tester les états de dégradation sur simulateur.",
      options: {
        auto: {
          label: "Auto",
          description: "Utilise l'état de connectivité réel de l'appareil.",
        },
        offline: {
          label: "Hors ligne",
          description:
            "Force les surfaces publiques dans leur fallback hors ligne.",
        },
        backendDegraded: {
          label: "Backend dégradé",
          description: "Affiche l'état de bannière backend dégradé.",
        },
        authDegraded: {
          label: "Auth dégradée",
          description: "Affiche l'état de bannière auth membre dégradée.",
        },
      },
    },
  },
} as const;

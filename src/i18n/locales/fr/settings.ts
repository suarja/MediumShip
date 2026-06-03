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
  account: {
    status: "Statut",
    guest: "Invite",
    memberFeatures: "Reserve aux membres",
    memberFeaturesDescription:
      "Creez un compte pour synchroniser la progression, enregistrer des contenus, telecharger les formats pris en charge et acceder aux fonctions premium.",
    signedInAs: "Connecté en tant que",
    signOut: "Se déconnecter",
  },
  debug: {
    network: {
      label: "Surcharge d'etat reseau",
      description:
        "Surcharge reservee au developpement pour tester les etats de degradation sur simulateur.",
      options: {
        auto: {
          label: "Auto",
          description: "Utilise l'etat de connectivite reel de l'appareil.",
        },
        offline: {
          label: "Hors ligne",
          description:
            "Force les surfaces publiques dans leur fallback hors ligne.",
        },
        backendDegraded: {
          label: "Backend degrade",
          description: "Affiche l'etat de banniere backend degrade.",
        },
        authDegraded: {
          label: "Auth degradee",
          description: "Affiche l'etat de banniere auth membre degradee.",
        },
      },
    },
  },
} as const;

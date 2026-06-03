export default {
  title: "Réglages",
  subtitle: "Gérez la langue et l'identité visuelle du client.",
  sections: {
    general: "Général",
    account: "Compte",
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
    },
  },
  account: {
    signedInAs: "Connecté en tant que",
    signOut: "Se déconnecter",
  },
} as const;

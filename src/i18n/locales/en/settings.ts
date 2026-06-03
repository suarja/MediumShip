export default {
  title: "Settings",
  subtitle: "Manage language and the tenant visual identity.",
  sections: {
    general: "General",
    account: "Account",
  },
  language: {
    label: "Language",
    description: "Choose the app language used across the mobile experience.",
    fr: "French",
    en: "English",
  },
  appearance: {
    themeLabel: "Palette",
    themeDescription:
      "Choose the tenant visual preset. The database stores only this palette name.",
    palettes: {
      brick: {
        label: "Editorial Brick",
        description: "Warm, premium, magazine-like.",
      },
      fjord: {
        label: "Clear Fjord",
        description: "Cleaner, fresher, more product-facing.",
      },
      canopy: {
        label: "Canopy",
        description: "Muted green, more institutional.",
      },
      midnight: {
        label: "Midnight",
        description: "Dark, denser, high-contrast version.",
      },
    },
  },
  account: {
    status: "Status",
    guest: "Guest",
    memberFeatures: "Members only",
    memberFeaturesDescription:
      "Create an account to sync progress, save items, download supported content, and access premium features.",
    signedInAs: "Signed in as",
    signOut: "Sign out",
  },
} as const;

export default {
  title: "Settings",
  subtitle: "Manage language and the tenant visual identity.",
  sections: {
    general: "General",
    account: "Account",
    debug: "Debug",
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
      onde: {
        label: "Burgundy Onde",
        description: "Deep burgundy, literary and premium.",
      },
      boussole: {
        label: "Cobalt Boussole",
        description: "Cool cobalt, analytical and civic.",
      },
      commune: {
        label: "Warm Commune",
        description: "Warm ochre, humanist and engaging.",
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
  debug: {
    network: {
      label: "Network state override",
      description:
        "Developer-only override for degraded-state testing on the simulator.",
      options: {
        auto: {
          label: "Auto",
          description: "Use the real device connectivity state.",
        },
        offline: {
          label: "Offline",
          description: "Force public surfaces into their offline fallback.",
        },
        backendDegraded: {
          label: "Backend degraded",
          description: "Show the backend degraded banner state.",
        },
        authDegraded: {
          label: "Auth degraded",
          description: "Show the member-auth degraded banner state.",
        },
      },
    },
  },
} as const;

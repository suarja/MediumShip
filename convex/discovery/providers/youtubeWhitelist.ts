/**
 * Curated whitelist of YouTube channels for the discovery feed.
 *
 * Channel IDs are stable even when a channel renames its handle.
 * Verify a channel ID at: youtube.com/channel/<channelId>
 *
 * `defaultCategory` seeds the scoring affinity when a video carries no
 * extractable tags — it maps to the tenant's category taxonomy.
 *
 * To add a channel: find its ID via youtube.com/@handle → About → Share →
 * copy URL → extract the UCxxxxxxx segment.
 */

export type WhitelistChannel = {
  readonly channelId: string;
  readonly label: string;
  readonly defaultCategory: string;
};

// ─── French whitelist ─────────────────────────────────────────────────────────

export const YOUTUBE_WHITELIST_FR: ReadonlyArray<WhitelistChannel> = [
  // Sciences
  { channelId: "UCaNlbnghtwlsGF-KzAFThqA", label: "Science étonnante",    defaultCategory: "science" },
  { channelId: "UCtqICqGbPSbTN09K1_7VZ3Q", label: "Dirty Biology",         defaultCategory: "science" },
  { channelId: "UCcziTK2NKeWtWQ6kB5tmQ8Q", label: "E-penser",              defaultCategory: "science" },

  // Histoire
  { channelId: "UCP46_MXP_WG_auH88FnfS1A", label: "Nota Bene",             defaultCategory: "histoire" },
  { channelId: "UCWWzB99AURYo2KLzCReWqmA", label: "Herodot'com",           defaultCategory: "histoire" },

  // Philosophie & pensée critique
  { channelId: "UCqA8H22FwgBVcF3GJpp0MQw", label: "Monsieur Phi",          defaultCategory: "philosophie" },
  { channelId: "UCq-8pBMM3I40QlrhM9ExXJQ", label: "La Tronche en Biais",   defaultCategory: "pensée critique" },
  { channelId: "UCNHFiyWgsnaSOsMtSoV_Q1A", label: "Axiome",                defaultCategory: "philosophie" },

  // Économie & société
  { channelId: "UC7sXGI8p8PvKosLWagkK9wQ", label: "Heu?reka",              defaultCategory: "économie" },
  { channelId: "UCyJDHgrsUKuWLe05GvC2lng", label: "Stupid Economics",       defaultCategory: "économie" },

  // Énergie & environnement
  { channelId: "UC1EacOJoqsKaYxaDomTCTEQ", label: "Le Réveilleur",         defaultCategory: "environnement" },
  { channelId: "UC9mes7ZXbrZ_UXn0jzBt21A", label: "Bon Pote",              defaultCategory: "environnement" },

  // Tech & numérique
  { channelId: "UCWedHS9qKebauVIK2J7383g", label: "Underscore_",           defaultCategory: "tech" },
  { channelId: "UCYnvxJ-PKiGXo_tYXpWAC-w", label: "Micode",               defaultCategory: "tech" },

  // Langue & culture
  { channelId: "UCofQxJWd4qkqc7ZgaLkZfcw", label: "Linguisticae",         defaultCategory: "langue" },

  // Géopolitique & documentaire
  { channelId: "UCwI-JbGNsojunnHbFAc0M4Q", label: "Arte",                  defaultCategory: "documentaire" },
  { channelId: "UCHGMBrXUzClgjEzBMei-Jdw", label: "Le Dessous des Cartes", defaultCategory: "géopolitique" },
];

// ─── English whitelist (to fill) ─────────────────────────────────────────────

export const YOUTUBE_WHITELIST_EN: ReadonlyArray<WhitelistChannel> = [
  // Placeholder — add Kurzgesagt, Veritasium, TED, 3Blue1Brown, Tom Scott, etc.
];

// ─── Registry ─────────────────────────────────────────────────────────────────

export const YOUTUBE_WHITELIST = {
  fr: YOUTUBE_WHITELIST_FR,
  en: YOUTUBE_WHITELIST_EN,
} as const;

export type YouTubeWhitelistLocale = keyof typeof YOUTUBE_WHITELIST;

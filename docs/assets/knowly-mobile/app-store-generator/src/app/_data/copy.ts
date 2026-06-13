/* Localized strings for the App Store screenshot generator.
 *
 * In-phone captures stay in French for the first pass — Apple accepts
 * non-localized screenshot content. Flip MOCKUP_LOCALE_FOR[locale] to "en"
 * once English captures exist.
 *
 * Markup in headline strings (rendered by fmtCopy in page.tsx):
 *   - "\n"     → line break
 *   - "*word*" → accent terracotta, italic (Newsreader)
 */

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABEL: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/* Which language's in-phone capture to use per UI locale. FR everywhere for now. */
export const MOCKUP_LOCALE_FOR: Record<Locale, "fr" | "en"> = {
  fr: "fr",
  en: "fr",
};

/* Slide order = App Store screenshot order. `id` also names the capture file:
 *   public/screenshots/<mockupLocale>/<id>.png
 * and the exported PNG filename. */
export const SLIDE_IDS = [
  "home",
  "article",
  "episode",
  "video",
  "premium",
] as const;
export type SlideId = (typeof SLIDE_IDS)[number];

/* Layout variant per slide — alternates composition so the set has rhythm.
 *   "bottom" → caption top, phone anchored bottom-center
 *   "right"  → caption left, phone right
 *   "left"   → caption right, phone left */
export const SLIDE_LAYOUT: Record<SlideId, "bottom" | "right" | "left"> = {
  home: "bottom",
  article: "right",
  episode: "left",
  video: "right",
  premium: "bottom",
};

/* Dark slides invert the warm base to near-black for contrast variety. */
export const SLIDE_DARK: Record<SlideId, boolean> = {
  home: false,
  article: false,
  episode: false,
  video: true,
  premium: true,
};

export type SlideCopy = {
  kicker: string;
  headline: string;
  sub: string;
  chipLabel?: string;
  chipValue?: string;
};

export type AllCopy = Record<SlideId, SlideCopy>;

export const COPY: Record<Locale, AllCopy> = {
  fr: {
    home: {
      kicker: "TON MÉDIA · UN SEUL FLUX",
      headline: "Articles, podcasts\net *vidéos*. Réunis.",
      sub: "Un fil d'accueil qui mêle tous tes formats. Pensé pour ton audience, pas pour un algorithme.",
      chipLabel: "FORMATS",
      chipValue: "3 en 1",
    },
    article: {
      kicker: "LECTURE · SANS BRUIT",
      headline: "Des articles qui\nse *lisent* vraiment.",
      sub: "Typographie éditoriale, rythme calme, zéro distraction. La lecture longue retrouve sa place.",
      chipLabel: "LECTURE",
      chipValue: "8 min",
    },
    episode: {
      kicker: "PODCAST · ARRIÈRE-PLAN",
      headline: "Écoute tes\népisodes. *Partout*.",
      sub: "Lecture audio en arrière-plan, reprise là où tu t'es arrêté. Tes oreilles font le reste.",
      chipLabel: "AUDIO",
      chipValue: "Arrière-plan",
    },
    video: {
      kicker: "VIDÉO · INTÉGRÉE",
      headline: "La vidéo, sans\nquitter ton *média*.",
      sub: "YouTube ou vidéo hébergée, lecture native, plein écran. Le format vidéo sans la dispersion.",
      chipLabel: "VIDÉO",
      chipValue: "Native",
    },
    premium: {
      kicker: "PREMIUM · HORS-LIGNE",
      headline: "Premium.\n*Hors-ligne*. À toi.",
      sub: "Débloque l'accès membre, télécharge pour le métro, l'avion, le tunnel. Rien ne te retient.",
      chipLabel: "ACCÈS",
      chipValue: "Hors-ligne",
    },
  },
  en: {
    home: {
      kicker: "YOUR MEDIA · ONE FEED",
      headline: "Articles, podcasts\nand *video*. United.",
      sub: "A home feed that blends every format. Built for your audience — not for an algorithm.",
      chipLabel: "FORMATS",
      chipValue: "3 in 1",
    },
    article: {
      kicker: "READING · NO NOISE",
      headline: "Articles you\nactually *read*.",
      sub: "Editorial typography, a calm pace, zero distraction. Long-form reading gets its place back.",
      chipLabel: "READ",
      chipValue: "8 min",
    },
    episode: {
      kicker: "PODCAST · BACKGROUND",
      headline: "Listen to your\nepisodes. *Anywhere*.",
      sub: "Background audio, resumes right where you left off. Your ears do the rest.",
      chipLabel: "AUDIO",
      chipValue: "Background",
    },
    video: {
      kicker: "VIDEO · BUILT IN",
      headline: "Video, without\nleaving your *media*.",
      sub: "YouTube or hosted video, native playback, full screen. The video format without the scatter.",
      chipLabel: "VIDEO",
      chipValue: "Native",
    },
    premium: {
      kicker: "PREMIUM · OFFLINE",
      headline: "Premium.\n*Offline*. Yours.",
      sub: "Unlock member access, download for the subway, the plane, the tunnel. Nothing holds you back.",
      chipLabel: "ACCESS",
      chipValue: "Offline",
    },
  },
};

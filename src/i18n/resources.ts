import authEn from "./locales/en/auth";
import commonEn from "./locales/en/common";
import homeEn from "./locales/en/home";
import navigationEn from "./locales/en/navigation";
import premiumEn from "./locales/en/premium";
import profileEn from "./locales/en/profile";
import settingsEn from "./locales/en/settings";
import authFr from "./locales/fr/auth";
import commonFr from "./locales/fr/common";
import homeFr from "./locales/fr/home";
import navigationFr from "./locales/fr/navigation";
import premiumFr from "./locales/fr/premium";
import profileFr from "./locales/fr/profile";
import settingsFr from "./locales/fr/settings";

export const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    home: homeEn,
    navigation: navigationEn,
    profile: profileEn,
    premium: premiumEn,
    settings: settingsEn,
  },
  fr: {
    common: commonFr,
    auth: authFr,
    home: homeFr,
    navigation: navigationFr,
    profile: profileFr,
    premium: premiumFr,
    settings: settingsFr,
  },
} as const;

export const supportedLanguages = ["fr", "en"] as const;

export type AppLanguage = (typeof supportedLanguages)[number];
export type AppNamespace = keyof (typeof resources)["fr"];

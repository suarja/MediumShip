import articleEn from "./locales/en/article";
import authEn from "./locales/en/auth";
import commonEn from "./locales/en/common";
import discoverEn from "./locales/en/discover";
import episodeEn from "./locales/en/episode";
import exploreEn from "./locales/en/explore";
import homeEn from "./locales/en/home";
import libraryEn from "./locales/en/library";
import listsEn from "./locales/en/lists";
import navigationEn from "./locales/en/navigation";
import networkEn from "./locales/en/network";
import paywallEn from "./locales/en/paywall";
import premiumEn from "./locales/en/premium";
import profileEn from "./locales/en/profile";
import settingsEn from "./locales/en/settings";
import videoEn from "./locales/en/video";
import articleFr from "./locales/fr/article";
import authFr from "./locales/fr/auth";
import commonFr from "./locales/fr/common";
import discoverFr from "./locales/fr/discover";
import episodeFr from "./locales/fr/episode";
import exploreFr from "./locales/fr/explore";
import homeFr from "./locales/fr/home";
import libraryFr from "./locales/fr/library";
import listsFr from "./locales/fr/lists";
import navigationFr from "./locales/fr/navigation";
import networkFr from "./locales/fr/network";
import paywallFr from "./locales/fr/paywall";
import premiumFr from "./locales/fr/premium";
import profileFr from "./locales/fr/profile";
import settingsFr from "./locales/fr/settings";
import videoFr from "./locales/fr/video";

export const resources = {
  en: {
    common: commonEn,
    discover: discoverEn,
    auth: authEn,
    home: homeEn,
    explore: exploreEn,
    library: libraryEn,
    lists: listsEn,
    navigation: navigationEn,
    profile: profileEn,
    premium: premiumEn,
    paywall: paywallEn,
    settings: settingsEn,
    article: articleEn,
    episode: episodeEn,
    video: videoEn,
    network: networkEn,
  },
  fr: {
    common: commonFr,
    discover: discoverFr,
    auth: authFr,
    home: homeFr,
    explore: exploreFr,
    library: libraryFr,
    lists: listsFr,
    navigation: navigationFr,
    profile: profileFr,
    premium: premiumFr,
    paywall: paywallFr,
    settings: settingsFr,
    article: articleFr,
    episode: episodeFr,
    video: videoFr,
    network: networkFr,
  },
} as const;

export const supportedLanguages = ["fr", "en"] as const;

export type AppLanguage = (typeof supportedLanguages)[number];
export type AppNamespace = keyof (typeof resources)["fr"];

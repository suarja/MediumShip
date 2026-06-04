import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources, supportedLanguages, type AppLanguage } from "./resources";
import { getStoredLanguage, setStoredLanguage } from "./storage";

const fallbackLanguage: AppLanguage = "fr";

let initPromise: Promise<typeof i18n> | null = null;

function pickSupportedLanguage(): AppLanguage {
  const locales = Localization.getLocales();

  for (const locale of locales) {
    const languageCode = locale.languageCode?.toLowerCase();
    if (
      languageCode &&
      supportedLanguages.includes(languageCode as AppLanguage)
    ) {
      return languageCode as AppLanguage;
    }
  }

  return fallbackLanguage;
}

export function initI18n(): Promise<typeof i18n> {
  if (i18n.isInitialized) {
    return Promise.resolve(i18n);
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const storedLanguage = await getStoredLanguage();

    await i18n.use(initReactI18next).init({
      compatibilityJSON: "v4",
      resources,
      lng: storedLanguage ?? pickSupportedLanguage(),
      fallbackLng: fallbackLanguage,
      defaultNS: "common",
      ns: [
        "common",
        "auth",
        "home",
        "library",
        "profile",
        "premium",
        "settings",
        "navigation",
        "article",
        "episode",
        "video",
        "network",
      ],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      returnNull: false,
    });

    return i18n;
  })();

  return initPromise;
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await setStoredLanguage(language);
}

export { i18n };

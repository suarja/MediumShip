import * as SecureStore from "expo-secure-store";

import type { AppLanguage } from "./resources";

const LANGUAGE_KEY = "i18n.language";

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  try {
    const language = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (language === "fr" || language === "en") {
      return language;
    }
  } catch {
    // Ignore persistence failures and fall back to system locale.
  }

  return null;
}

export async function setStoredLanguage(language: AppLanguage): Promise<void> {
  try {
    await SecureStore.setItemAsync(LANGUAGE_KEY, language);
  } catch {
    // Ignore persistence failures so language switching still works in memory.
  }
}

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { changeAppLanguage } from "./index";
import type { AppLanguage } from "./resources";

export function useSelectedLanguage() {
  const { i18n } = useTranslation();

  const language: AppLanguage = (i18n.resolvedLanguage ?? i18n.language).startsWith(
    "en",
  )
    ? "en"
    : "fr";

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    await changeAppLanguage(nextLanguage);
  }, []);

  return { language, setLanguage };
}

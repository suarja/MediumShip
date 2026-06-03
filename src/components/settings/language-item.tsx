import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSelectedLanguage } from "../../i18n/use-selected-language";
import type { AppLanguage } from "../../i18n/resources";
import { SettingsChoiceItem } from "./settings-choice-item";

export function LanguageItem({ isLast = false }: { isLast?: boolean }) {
  const { t } = useTranslation("settings");
  const { language, setLanguage } = useSelectedLanguage();
  const [changingLanguage, setChangingLanguage] = useState<AppLanguage | null>(
    null,
  );

  const options = useMemo(
    () => [
      { value: "fr" as const, label: t("language.fr") },
      { value: "en" as const, label: t("language.en") },
    ],
    [t, language],
  );

  const selectedOption = options.find((option) => option.value === language);

  const handleSelect = async (nextLanguage: AppLanguage) => {
    try {
      setChangingLanguage(nextLanguage);
      await setLanguage(nextLanguage);
    } finally {
      setChangingLanguage(null);
    }
  };

  return (
    <SettingsChoiceItem
      label={t("language.label")}
      description={t("language.description")}
      value={selectedOption?.label}
      options={options}
      selectedValue={language}
      onSelect={(nextLanguage) => handleSelect(nextLanguage as AppLanguage)}
      busyValue={changingLanguage}
      isLast={isLast}
    />
  );
}

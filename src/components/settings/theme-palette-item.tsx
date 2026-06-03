import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../../../convex/_generated/api";
import {
  isThemePaletteName,
  listThemePalettes,
  themePaletteNames,
  ThemePaletteName,
} from "../../features/theme/palette-catalog";
import { useAppTheme } from "../../features/theme/theme-provider";
import { SettingsChoiceItem } from "./settings-choice-item";

export function ThemePaletteItem({ isLast = false }: { isLast?: boolean }) {
  const { t } = useTranslation("settings");
  const { themeConfig } = useAppTheme();
  const setDefaultTenantPalette = useMutation(
    api.tenants.mutations.setDefaultTenantPalette,
  );
  const [changingPalette, setChangingPalette] = useState<ThemePaletteName | null>(
    null,
  );

  const options = useMemo(
    () =>
      listThemePalettes().map((option) => ({
        value: option.paletteName,
        label: t(`appearance.palettes.${option.paletteName}.label`),
        description: t(`appearance.palettes.${option.paletteName}.description`),
        swatches: option.swatches,
      })),
    [t],
  );

  const value = t(`appearance.palettes.${themeConfig.paletteName}.label`);

  const handleSelect = async (nextPalette: string) => {
    if (!isThemePaletteName(nextPalette)) {
      return;
    }

    try {
      setChangingPalette(nextPalette);
      await setDefaultTenantPalette({ paletteName: nextPalette });
    } finally {
      setChangingPalette(null);
    }
  };

  return (
    <SettingsChoiceItem
      label={t("appearance.themeLabel")}
      description={t("appearance.themeDescription")}
      value={value}
      options={options}
      selectedValue={themeConfig.paletteName}
      onSelect={handleSelect}
      busyValue={changingPalette}
      isLast={isLast}
    />
  );
}

export const supportedThemePaletteNames = themePaletteNames;

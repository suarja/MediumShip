import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  NetworkStateOverride,
  useNetworkStatusDebug,
} from "../../features/network/use-network-status";
import { SettingsChoiceItem } from "./settings-choice-item";

const ORDERED_OPTIONS: NetworkStateOverride[] = [
  "auto",
  "offline",
  "backendDegraded",
  "authDegraded",
];

export function NetworkStateDebugItem({ isLast = false }: { isLast?: boolean }) {
  const { t } = useTranslation("settings");
  const { override, setOverride } = useNetworkStatusDebug();

  const options = useMemo(
    () =>
      ORDERED_OPTIONS.map((value) => ({
        value,
        label: t(`debug.network.options.${value}.label`),
        description: t(`debug.network.options.${value}.description`),
      })),
    [t],
  );

  const currentOption =
    options.find((option) => option.value === override) ?? options[0];

  return (
    <SettingsChoiceItem
      label={t("debug.network.label")}
      description={t("debug.network.description")}
      value={currentOption.label}
      options={options}
      selectedValue={override}
      onSelect={async (value) => setOverride(value as NetworkStateOverride)}
      isLast={isLast}
    />
  );
}
